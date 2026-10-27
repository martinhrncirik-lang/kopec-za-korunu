'use client';
import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import { decodePolyline } from '@/lib/polyline';

// Mapa trasy: podklad OpenStreetMap, trasa v barvě aplikace, start zeleně, cíl červeně.
export default function RouteMap({ polyline }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!polyline || !ref.current) return;
    let map;
    let cancelled = false;
    import('leaflet').then((L) => {
      if (cancelled || !ref.current) return;
      const pts = decodePolyline(polyline);
      if (pts.length < 2) return;
      map = L.map(ref.current, { zoomControl: false, attributionControl: true, scrollWheelZoom: false });
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      const line = L.polyline(pts, { color: '#fc4c02', weight: 4, opacity: 0.95 }).addTo(map);
      const dot = (p, color) =>
        L.circleMarker(p, { radius: 6, color: '#fff', weight: 2, fillColor: color, fillOpacity: 1 }).addTo(map);
      dot(pts[0], '#2e9d5b');
      dot(pts[pts.length - 1], '#c62828');
      map.fitBounds(line.getBounds(), { padding: [18, 18] });
      L.control.zoom({ position: 'bottomright' }).addTo(map);
    });
    return () => {
      cancelled = true;
      if (map) map.remove();
    };
  }, [polyline]);

  if (!polyline) return null;
  return <div ref={ref} className="route-map" />;
}
