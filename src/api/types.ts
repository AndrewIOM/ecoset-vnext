
type unit = void;

export type Failure<A> = {
    kind: "failure",
    message: A
}

export type Ok<A> = {
    kind: "ok",
    result: A
}

export type Result<A,B> = Ok<A> | Failure<B>

// Spatial point represented in WGS84 grid.
// Latitude is from -90 to 90; Longitude is from -180 to 180
export type PointWGS84 = {
    Latitude: number
    Longitude: number
}

export type SimpleDate = {
    Year: number,
    Month: number | null,
    Day: number | null
}

export interface TimeBefore {
    kind: "before",
    date: SimpleDate
}

export interface TimeExact {
    kind: "exact",
    date: SimpleDate
}

export interface Latest {
    kind: "latest"
}

export type Time = Latest | TimeExact | TimeBefore

export interface SlicedTime {
    kind : "timeSlice";
    slices: SimpleDate[]
}

export interface ContinuousTime {
    kind: "timeExtent";
    minDate: SimpleDate
    maxDate: SimpleDate
}

export type TemporalDimension = SlicedTime | ContinuousTime

// Represents a computation function for a variable
export interface IVariableMethod {

    // Runs computation for given spatial-temporal constraints and outputs to file.
    computeToFile(space:PointWGS84[],time:Time,outputDir:string,options:any) : Promise<Result<unit,string>>;

    // Returns the spatial dimensions for which computation can be conducted.
    spatialDimension() : PointWGS84[];

    // Returns the spatial dimensions for which computation can be conducted.
    temporalDimension(): TemporalDimension;

    // True if data can be computed for the specified date.
    availableForDate(date:Date) : boolean;

    // True if data can be computed for specified point cloud.
    availableForSpace(points:PointWGS84[]): boolean;

    // List output options
    availableOutputTypes() : string[]
}

// Registry of IVariablePlugin implementations
export namespace IVariableMethod {

    type Constructor<T> = {
        new(...args: any[]): T;
        readonly prototype: T;
    }

    const implementations: Constructor<IVariableMethod>[] = [];

    export function getImplementations() : Constructor<IVariableMethod>[] {
        return implementations;
    }

    export function register<T extends Constructor<IVariableMethod>>(ctor: T) {
        implementations.push(ctor);
        return ctor;
    }
}

// Variables:
// [ - InternalShortName ]
// - FriendlyName
// - Description
// - Methods for computation (e.g. different methods for calculating land cover)

// Variables may use the same processing method with different
// argments. Therefore IVariablePlugins may be shared.
// - Dependencies between plugins.

// Geotemporal dimensions may be:
// - Continuous timeframe / spatial frame
// - For space, a particular region e.g. Europe, land vs sea (mask)
// - For time, specific timestamps



export enum JobState {
    NonExistent = "NonExistent",
    Queued = "Queued",
    Processing = "Processing",
    Ready = "Ready",
    Failed = "Failed"
}

type Variable = {
    Name: string
    Method: string
    // Statistics - are these required?
}

// An API request DTO
export type EcosetJobRequest = {
    LatitudeNorth: number
    LatitudeSouth: number
    LongitudeWest: number
    LongitudeEast: number
    TimeMode: Time
    Year: number
    Month: number
    Day: number
    Executables: Array<Variable>
}
