export interface GeoJSONFeature {
  type: 'Feature';
  geometry: any; // Consider using a more specific GeoJSON geometry type if available from a library
  properties: Record<string, any> | null;
}

export interface GeoJSON {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

export interface ParsedFeature {
  id: number;
  wkt: string;
  properties: Record<string, any> | null;
}

export interface FieldDefinition {
  name: string;      // Original key from properties
  inferredType: string;
  alias: string;     // Alias for the field name, defaults to name
}

// Error type for parser, could be shared or kept within hooks if specific
export interface ParserError {
  message: string;
  details?: any;
} 