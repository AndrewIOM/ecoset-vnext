import { IVariableMethod, PointWGS84, TemporalDimension } from "./types";
import config from 'config';
import { logger } from './logger';
import  "./../variable-methods/index";

// Configuration file parser
// __________________________

type MethodListItem = {
    Id: string
    FriendlyName: string
    Description: string
    License: string
    LicenseUrl: string
    Implementation: string
    DependsOn: string[]
    Options: any
}

type VariableListItem = {
    Id: string
    FriendlyName: string
    Description: string
    Unit: string
    Methods: MethodListItem[]
}

let parseVariableConfiguration = 
    (variables:any[]) : VariableListItem[] =>
        variables.map((x:any) => {
            let keys = Object.keys(x);
            let name = keys[0];
            let v = x[name];
            let methods =
                v.methods.map((m:any) => {
                    let keys = Object.keys(m);
                    let name = keys[0];
                    let v = m[name];
                    return {
                        Id: name,
                        FriendlyName: v.name,
                        Description: v.description,
                        Implementation: v.implementation,
                        License: v.license,
                        LicenseUrl: v.licenseUrl,
                        DependsOn: v.depends_on == undefined ? [] : v.depends_on,
                        Options: v.options
                    }
                })
            return {
                Id: name,
                FriendlyName: v.name,
                Description: v.description,
                Unit: v.Unit,
                Methods: methods
            }
        });

// Helpers
// __________________________

function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
    return value !== null && value !== undefined;
}

const variablesWithDimensions = (variables:VariableListItem[]) => {
    return variables.map(v => {
        const methods = 
            v.Methods.map(m => {
                const imp = variableMethods.find(vm => m.Implementation == vm.name.replace("VariableMethod",""));
                const dependenciesExist = m.DependsOn.every(d => variables.find(x => x.Id == d) !== undefined);
                if (imp == undefined || !dependenciesExist) { return null; }
                const method = new imp(m.Options);
                return {
                    Id: m.Id,
                    Name: m.FriendlyName,
                    License: m.License,
                    LicenseUrl: m.LicenseUrl,
                    Time: method.temporalDimension(),
                    Space: method.spatialDimension(),
                    Imp: method
                }
            }).filter(notEmpty);
        return {
            Id: v.Id,
            Name: v.FriendlyName,
            Description: v.Description,
            Unit: v.Unit,
            Methods: methods
        }
    });
}

interface MethodDTO {
    Id: string,
    Name: string,
    License: string,
    LicenseUrl: string,
    TemporalExtent: TemporalDimension,
    SpatialExtent: PointWGS84[]
}

interface VariableDTO {
    Id: string
    FriendlyName: string
    Description: string
    Unit: string
    Methods: MethodDTO[]
}

// Load variables and config
// __________________________

const variables = parseVariableConfiguration(config.get("variables"));
const variableMethods = IVariableMethod.getImplementations();
const implementedVariables = variablesWithDimensions(variables);

variableMethods.map(v => { logger.info("Loaded method: " + v.name) })
implementedVariables.map(v => { logger.info("Loaded variable: " + v.Name) })

export function listVariables () {
    return implementedVariables;
}

export function getDependencies (variableId:string, methodId:string) {
    const v = variables.find(m => m.Id == variableId);
    if (v) {
        const m = v.Methods.find(m => m.Id == methodId);
        if (m) {
            return m.DependsOn;
        }
    }
    return [];
}

export function listVariableDtos () : VariableDTO[] {
    return implementedVariables.map(v => {
        return {
            Id: v.Id,
            FriendlyName: v.Name, 
            Description: v.Description,
            Unit: v.Unit,
            Methods: v.Methods.map(m => {
                return {
                    Id: m.Id,
                    Name: m.Name,
                    License: m.License,
                    LicenseUrl: m.LicenseUrl,
                    TemporalExtent: m.Imp.temporalDimension(),
                    SpatialExtent: m.Imp.spatialDimension()              
                }
            })
        }
    })
}