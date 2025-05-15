import React from 'react';
import WKT from 'wkt'; // Assuming wkt.parse returns an object with a 'type' and 'coordinates'

interface WKTPreviewProps {
  wktString: string;
  size?: number; // Size of the SVG canvas (width and height)
}

// Helper to calculate bounding box and transform coordinates
const getTransformedCoordinates = (geometry: any, svgSize: number, padding: number): any[] => {
  let allCoords: number[][] = [];
  const size = svgSize - 2 * padding; // available drawing area

  // Extract all coordinates
  const extractCoords = (coords: any) => {
    if (!coords) return;
    if (typeof coords[0] === 'number') { // A single point [x, y]
      allCoords.push(coords as number[]);
    } else if (Array.isArray(coords[0]) && typeof coords[0][0] === 'number') { // An array of points [[x,y], [x,y]] or a polygon ring
      (coords as number[][]).forEach(c => allCoords.push(c));
    } else if (Array.isArray(coords[0]) && Array.isArray(coords[0][0])) { // Array of arrays of points (MultiLineString, Polygon with holes, MultiPolygon)
      (coords as number[][][]).forEach(extractCoords);
    } else if (Array.isArray(coords[0]) && Array.isArray(coords[0][0]) && Array.isArray(coords[0][0][0])) { // Array of arrays of arrays of points (MultiPolygon with holes)
        (coords as number[][][][]).forEach(extractCoords);
    }
  };

  extractCoords(geometry.coordinates);

  if (allCoords.length === 0) return [];

  const minX = Math.min(...allCoords.map(c => c[0]));
  const maxX = Math.max(...allCoords.map(c => c[0]));
  const minY = Math.min(...allCoords.map(c => c[1]));
  const maxY = Math.max(...allCoords.map(c => c[1]));

  const geoWidth = maxX - minX;
  const geoHeight = maxY - minY;

  if (geoWidth === 0 && geoHeight === 0 && allCoords.length === 1) { // Single point
    return [[svgSize / 2, svgSize / 2]]; // Center it
  }
  
  // Avoid division by zero if geometry is a point or a straight line (no area)
  const scaleX = geoWidth === 0 ? 1 : size / geoWidth;
  const scaleY = geoHeight === 0 ? 1 : size / geoHeight;
  const scale = Math.min(scaleX, scaleY); // Maintain aspect ratio

  const transform = (coords: any[]): any[] => {
    if (typeof coords[0] === 'number') { // Point [x, y]
      const x = padding + (coords[0] - minX) * scale;
      const y = padding + (maxY - coords[1]) * scale; // Invert Y for SVG (origin top-left)
      return [x,y];
    }
    return coords.map(transform); // Recurse for arrays of points/rings
  };
  
  // Need to handle structure for MultiLineString, MultiPolygon correctly after transformation
  if (geometry.type === 'MultiPoint') {
      return geometry.coordinates.map((point: number[]) => transform(point));
  }
  if (geometry.type === 'MultiLineString') {
      return geometry.coordinates.map((line: number[][]) => line.map(point => transform(point)));
  }
  if (geometry.type === 'Polygon') {
      return geometry.coordinates.map((ring: number[][]) => ring.map(point => transform(point)));
  }
  if (geometry.type === 'MultiPolygon') {
      return geometry.coordinates.map((polygon: number[][][]) => 
          polygon.map((ring: number[][]) => ring.map(point => transform(point)))
      );
  }

  return transform(geometry.coordinates);
};

const WktPreview: React.FC<WKTPreviewProps> = ({ wktString, size = 40 }) => {
  try {
    const geoJsonGeometry = WKT.parse(wktString);
    if (!geoJsonGeometry || !geoJsonGeometry.type || !geoJsonGeometry.coordinates) {
      return <span title={wktString} className="text-xs text-gray-500 dark:text-gray-400">Invalid Geom</span>;
    }

    const padding = 2;
    const transformedCoords = getTransformedCoordinates(geoJsonGeometry, size, padding);

    let svgPath: JSX.Element | null = null;

    // Theme-aware colors
    const pointFill = "fill-blue-500 dark:fill-blue-400";
    const lineStroke = "stroke-blue-500 dark:stroke-blue-400";
    const polygonFill = "fill-blue-500/30 dark:fill-blue-400/30"; // Using opacity with Tailwind colors
    const polygonStroke = "stroke-blue-600 dark:stroke-blue-500";

    switch (geoJsonGeometry.type) {
      case 'Point':
        if (transformedCoords && transformedCoords.length > 0) {
            const pt = transformedCoords[0] as number[];
            svgPath = <circle cx={pt[0]} cy={pt[1]} r="3" className={pointFill} />;
        }
        break;
      case 'MultiPoint':
        if (transformedCoords && transformedCoords.length > 0) {
            svgPath = (
                <g>
                    {(transformedCoords as number[][]).map((pt, idx) => (
                        <circle key={idx} cx={pt[0]} cy={pt[1]} r="2" className={pointFill} />
                    ))}
                </g>
            );
        }
        break;
      case 'LineString':
        if (transformedCoords && transformedCoords.length > 1) {
            const points = (transformedCoords as number[][]).map(p => p.join(',')).join(' ');
            svgPath = <polyline points={points} className={`${lineStroke} stroke-[1.5px] fill-none`} />;
        }
        break;
      case 'MultiLineString':
        if (transformedCoords && transformedCoords.length > 0) {
            svgPath = (
                <g>
                    {(transformedCoords as number[][][]).map((line, lineIdx) => {
                        const points = line.map(p => p.join(',')).join(' ');
                        return <polyline key={lineIdx} points={points} className={`${lineStroke} stroke-[1.5px] fill-none`} />;
                    })}
                </g>
            );
        }
        break;
      case 'Polygon':
        if (transformedCoords && transformedCoords.length > 0) {
             const allRingsPoints = (transformedCoords as number[][][]).map(ring => ring.map(p => p.join(',')).join(' ')).join(' ');
            svgPath = <polygon points={allRingsPoints} className={`${polygonStroke} ${polygonFill} stroke-[1.5px]`} />;
        }
        break;
      case 'MultiPolygon':
         if (transformedCoords && transformedCoords.length > 0) {
            svgPath = (
                <g>
                    {(transformedCoords as number[][][][]).map((polygon, polyIdx) => {
                        const outerRing = polygon[0].map(p => p.join(',')).join(' ');
                        return <polygon key={polyIdx} points={outerRing} className={`${polygonStroke} ${polygonFill} stroke-[1.5px]`} />;
                    })}
                </g>
            );
        }
        break;
      default:
        return <span title={wktString} className="text-xs text-gray-500 dark:text-gray-400">{geoJsonGeometry.type || 'Geom'}</span>;
    }

    if (!svgPath) {
        return <span title={wktString} className="text-xs text-gray-500 dark:text-gray-400">Preview N/A</span>;
    }

    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="border border-gray-300 dark:border-slate-600 rounded bg-gray-50 dark:bg-slate-700 transition-colors duration-300">
        {svgPath}
      </svg>
    );

  } catch (e) {
    console.warn('Error parsing or rendering WKT:', wktString, e);
    return <span title={wktString} className="text-xs text-red-500 dark:text-red-400">Error</span>;
  }
};

export default WktPreview; 