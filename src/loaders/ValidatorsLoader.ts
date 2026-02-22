import path from 'path';
import fileLoader from './_common/fileLoader';

export interface ValidatorFunction {
  (data: any): Promise<any>;
}

export interface ValidatorSet {
  [key: string]: ValidatorFunction;
}

/**
 * Lightweight validator loader.
 * Instead of relying on qantra-pineapple (proprietary), this loader reads
 * schema files and builds simple validation functions.
 * 
 * Each schema file exports an object where keys are operation names and
 * values are arrays of field rules: { path, type, required, length, ... }
 */
export default class ValidatorsLoader {
  private models: Record<string, any>;
  private customValidators: Record<string, (data: any) => boolean>;

  constructor({
    models,
    customValidators,
  }: {
    models: Record<string, any>;
    customValidators: Record<string, (data: any) => boolean>;
  }) {
    this.models = models;
    this.customValidators = customValidators;
  }

  load(): Record<string, Record<string, ValidatorFunction>> {
    const validators: Record<string, Record<string, ValidatorFunction>> = {};
    const isCompiled = __dirname.split(path.sep).includes('dist');
    const schemaGlob = isCompiled
      ? './dist/managers/**/*.schema.js'
      : './src/managers/**/*.schema.ts';
    const schemes = fileLoader(schemaGlob);

    Object.keys(schemes).forEach((sk) => {
      const schemaModule = schemes[sk].default || schemes[sk];
      validators[sk] = {};

      Object.keys(schemaModule).forEach((operationName) => {
        const rules = schemaModule[operationName];

        validators[sk][operationName] = async (data: any) => {
          const errors: string[] = [];

          for (const rule of rules) {
            const modelDef = this.models[rule.model] || rule;
            const fieldPath = modelDef.path || rule.model;
            const value = data[fieldPath];

            // Required check
            if (rule.required && (value === undefined || value === null || value === '')) {
              errors.push(`${fieldPath} is required`);
              continue;
            }

            if (value === undefined || value === null) continue;

            // Type check
            if (modelDef.type) {
              const expectedType = modelDef.type.toLowerCase();
              if (expectedType === 'string' && typeof value !== 'string') {
                errors.push(`${fieldPath} must be a string`);
                continue;
              }
              if (expectedType === 'number' && typeof value !== 'number') {
                errors.push(`${fieldPath} must be a number`);
                continue;
              }
            }

            // Length check
            if (modelDef.length && typeof value === 'string') {
              if (typeof modelDef.length === 'object') {
                if (modelDef.length.min && value.length < modelDef.length.min) {
                  errors.push(`${fieldPath} must be at least ${modelDef.length.min} characters`);
                }
                if (modelDef.length.max && value.length > modelDef.length.max) {
                  errors.push(`${fieldPath} must be at most ${modelDef.length.max} characters`);
                }
              }
            }

            // Regex check
            if (modelDef.regex && typeof value === 'string') {
              if (!modelDef.regex.test(value)) {
                errors.push(`${fieldPath} format is invalid`);
              }
            }

            // Custom validator
            if (rule.custom && this.customValidators[rule.custom]) {
              if (!this.customValidators[rule.custom](value)) {
                errors.push(`${fieldPath} failed custom validation`);
              }
            }
          }

          if (errors.length > 0) {
            return { error: errors.join(', '), errors };
          }
          return null;
        };
      });
    });

    return validators;
  }
}
