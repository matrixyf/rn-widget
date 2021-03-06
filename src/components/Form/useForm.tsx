/*
 * @Author: Hong.Zhang
 * @Date: 2022-06-13 14:34:59
 * @Description: 
 */
import React, { Component, useRef } from "react";
import type Field from './Field';
import Schema from 'async-validator';
import invariant from "invariant";
import { checkLoopDependencies } from "../../util/utils";

class FormStore extends Component {

  fieldEntities: Field[];
  stores: any;
  callbacks: any;
  touched: any;
  errors: any;
  dependenciesGraph: any;
  focusedField?: string;

  constructor(props?: any) {
    super(props);
    this.fieldEntities = [];
    this.stores = {};
    this.callbacks = {};
    this.touched = {};
    this.errors = {};
    this.dependenciesGraph = {};
    this.focusedField = undefined;
  }

  getFieldValue = (name: string) => {
    return this.stores[name];
  }

  getFieldsValue = () => {
    return this.stores;
  }

  setFieldsValue = (values: any) => {
    this.stores = {
      ...this.stores,
      ...values,
    }
  }
  
  setFieldValue = (name: string, value: any, withTouch = true) => {
    this.stores = {
      ...this.stores,
      [name]: value,
    }
    // whether change the touch status of the field
    // normally when the field its self change or click submit or initialValue setted, withTouch shoud be true
    // if setFieldValue by dependencies chain, withTouch shoud be false
    if (withTouch) {
      this.touched[name] = true;
    }
    const forceUpdateField = this.fieldEntities.find(field => field.name === name);
    if (!forceUpdateField) {
      return;
    }
    const descriptor = forceUpdateField.rule ? {
      [name]: forceUpdateField.rule,
    } : {};
    const validator = this.getValidator(descriptor);
    validator.validate({ [name]: value})
      .then(() => {
        this.setFieldError(name, undefined);
        this.notifyUpdate([name]);
      })
      .catch(({fields}) => {
        this.setFieldError(name, fields[name])
      });

    // check depency chain one by one
    // 1. for Select, clear the value for it;
    // 2. for other widget, set the original value just to trigger validate and notifyUpdate;
    if (!!this.dependenciesGraph[name] && this.dependenciesGraph[name].length > 0) {
      const dependencies = this.dependenciesGraph[name];
      dependencies.forEach((dependency: string) => {
        const dependencyField = this.fieldEntities.find(field => field.name === dependency);
        let isSelect = false;
        React.Children.forEach(dependencyField?.children, (child) => {
          const transferredChild = child as any;
          if (transferredChild?.type?.name === 'Select') {
            isSelect = true;
          }
        });
        if (isSelect) {
          this.setFieldValue(dependency, undefined, false);
        } else {
          this.setFieldValue(dependency, this.stores[dependency], false);
        }
      });
    }
  }

  registerField = (field: Field) => {
    this.checkUniqueName(field);
    this.fieldEntities.push(field);
    this.handleDependencies(field);
  }

  checkUniqueName = (field: Field) => {
    const { name } = field;
    const duplicate = this.fieldEntities.some(entity => entity.name === name);
    invariant(!!name && !duplicate, `field name ${name} is duplicated`);
  }

  handleDependencies = (field: Field) => {
    const { name, dependencies } = field;
    if (!dependencies || dependencies.length === 0) {
      return;
    }
    // name: a, dependencies: [b, c]
    dependencies.forEach(dependency => {
      if (!this.dependenciesGraph[dependency]) {
        this.dependenciesGraph[dependency] = [];
      }
      this.dependenciesGraph[dependency].push(name);
    });
    // dependenciesGraph = { b: [a], c: [a]}
    checkLoopDependencies(this.dependenciesGraph);
  }

  setCallbacks = (callbacks: any) => {
    this.callbacks = {
      ...this.callbacks,
      ...callbacks,
    }
  }

  setInitialValues = (values: any) => {
    this.stores = {
      ...values,
    }
    Object.keys(values).forEach(name => {
      this.touched[name] = true;
    });
  }

  getFieldError = (name: string) => {
    return this.errors[name];
  }

  setFieldError = (name: string, fieldError: any) => {
    if (!fieldError) { 
      delete this.errors[name];
    } else {
      this.errors = {
        ...this.errors,
        [name]: fieldError,
      };
    }
    
    this.notifyUpdate([name])
  }

  setFieldFocus = (name: string, focused: boolean) => {
    if (focused) {
      this.focusedField = name;
    } else {
      this.focusedField = undefined;
    }
    this.notifyUpdate([name]);
  }

  getFocusedField = () => {
    return this.focusedField;
  }

  setFieldsError = (fieldsError: any) => {
    this.errors = {
      ...fieldsError,
    };
    this.fieldEntities.forEach(field => {
      const name = field.name;
      this.touched[name] = true;
    });
    const errorFiledsNames = Object.keys(fieldsError); 
    this.notifyUpdate(errorFiledsNames);
  }

  notifyUpdate = (names: string[]) => {
    this.fieldEntities.forEach(field => {
      if (names.includes(field.name)) {
        field.onStoreChange();
      }
    });
  }

  getTouched = (name: string) => {
    return this.touched[name];
  }

  getValidator = (descriptor: any) => {
    return new Schema(descriptor);
  }

  submit = () => {
    const { onFinish, onFinishFailed } = this.callbacks;
    const validator = this.getValidator(
      this.fieldEntities.reduce((descriptor: any, field: Field) => {
        if (field.rule) {
          descriptor[field.name] = field.rule;
        }
        return descriptor;
      }, {})
    );
    validator.validate(this.stores)
      .then(() => {
        this.setFieldsError({});
        if (onFinish) {
          onFinish(this.stores);
        }
      })
      .catch(({errors, fields}) => {
        this.setFieldsError(fields);
        if (onFinishFailed) {
          onFinishFailed({
            errors,
            values: this.stores,
          });
        }
      });
  }

  getForm = (): FormInstance => {
    return {
      getFieldValue: this.getFieldValue,
      getFieldsValue: this.getFieldsValue,
      setFieldsValue: this.setFieldsValue,
      setFieldValue: this.setFieldValue,
      setFieldFocus: this.setFieldFocus,
      getFocusedField: this.getFocusedField,
      registerField: this.registerField,
      setCallbacks: this.setCallbacks,
      setInitialValues: this.setInitialValues,
      getFieldError: this.getFieldError,
      getTouched: this.getTouched,
      submit: this.submit,
    };
  }
}

export interface FormInstance {
  getFieldValue: Function;
  getFieldsValue: Function;
  setFieldsValue: Function;
  setFieldValue: Function;
  setFieldFocus: Function;
  getFocusedField: Function;
  registerField: Function;
  setCallbacks: Function;
  setInitialValues: Function;
  getFieldError: Function;
  getTouched: Function;
  submit: Function;
}


export default function useForm(form?: FormInstance): [FormInstance] {
  const formRef = useRef<FormInstance>();
  if (!formRef.current) {
    if (form) {
      formRef.current = form;
    } else {
      formRef.current = new FormStore().getForm();
    }
  }

  return [formRef.current];
}