"use client"

import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import { Coordinates, Toilet } from '@/lib/types';
import { formatDistance, calculateDistance, getStatusColor } from '@/lib/utils';

// Fix Leaflet marker icon issue
const DefaultIcon = L.icon({
  iconUrl: '/images/marker-icon.png',
  shadowUrl: '/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Use custom marker icons instead
const createToiletIcon = (status: string) => {
  const markerHtmlStyles = `
    background-color: ${status === 'available' ? '#22c55e' : status === 'occupied' ? '#f97316' : '#ef4444'};
    width: 2rem;
    height: 2rem;
    display: block;
    left: -1rem;
    top: -1rem;
    position: relative;
    border-radius: 2rem 2rem 0;
    transform: rotate(45deg);
    border: 1px solid #FFFFFF;
    box-shadow: 0 0 0 1px rgba(0,0,0,0.2);
  `;

  return L.divIcon({
    className: "custom-toilet-marker",
    iconAnchor: [0, 24],
    popupAnchor: [12, -20],
    html: `<span style="${markerHtmlStyles}" />`
  });
};

// Create user location icon
const userIcon = L.divIcon({
  className: "custom-user-marker",
  iconAnchor: [12, 12],
  html: `<span style="
    background-color: #3b82f6;
    width: 1.5rem;
    height: 1.5rem;
    display: block;
    left: -0.75rem;
    top: -0.75rem;
    position: relative;
    border-radius: 1.5rem;
    border: 3px solid #ffffff;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
  " />`
});

// Component to update map view when coordinates change
function MapUpdater({ coordinates }: { coordinates: Coordinates | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (coordinates) {
      map.setView([coordinates.latitude, coordinates.longitude], 15);
    }
  }, [coordinates, map]);
  
  return null;
}

interface MapComponentProps {
  toilets: Toilet[];
  userCoordinates: Coordinates | null;
}

export default function MapComponent({ toilets, userCoordinates }: MapComponentProps) {
  // Default center (will be overridden by user coordinates if available)
  const defaultCenter: [number, number] = userCoordinates 
    ? [userCoordinates.latitude, userCoordinates.longitude]
    : [40.7128, -74.0060]; // NYC as default
  
  return (
    <MapContainer 
      center={defaultCenter}
      zoom={15}
      style={{ height: "100%", minHeight: "500px", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Update map when user coordinates change */}
      <MapUpdater coordinates={userCoordinates} />
      
      {/* Show user location */}
      {userCoordinates && (
        <>
          <Marker 
            position={[userCoordinates.latitude, userCoordinates.longitude]}
            icon={userIcon}
          >
            <Popup>
              <div className="text-center">
                <strong>Votre position</strong>
              </div>
            </Popup>
          </Marker>
          
          {/* Show accuracy circle */}
          {userCoordinates.accuracy && (
            <Circle 
              center={[userCoordinates.latitude, userCoordinates.longitude]}
              radius={userCoordinates.accuracy}
              pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1 }}
            />
          )}
        </>
      )}
      
      {/* Display toilet markers */}
      {toilets.map(toilet => (
        <Marker
          key={toilet.id}
          position={[toilet.latitude, toilet.longitude]}
          icon={createToiletIcon(toilet.status)}
        >
          <Popup>
            <div className="p-1">
              <h3 className="font-medium">{toilet.name}</h3>
              <p className="text-sm text-muted-foreground">{toilet.address}</p>
              
              <div className="mt-2 flex items-center gap-1">
                <span className={`inline-block w-2 h-2 rounded-full ${getStatusColor(toilet.status)}`} />
                <span className="text-sm capitalize">
                  {/* Traduction du statut */}
                  {toilet.status === "available" && "Disponible"}
                  {toilet.status === "occupied" && "Occupé"}
                  {toilet.status === "closed" && "Fermé"}
                </span>
              </div>
              
              {userCoordinates && (
                <div className="mt-1 text-sm">
                  <span>Distance : {formatDistance(calculateDistance(
                    userCoordinates,
                    { latitude: toilet.latitude, longitude: toilet.longitude }
                  ))}</span>
                </div>
              )}
              
              <div className="mt-2">
                <a 
                  href={`/toilets/${toilet.id}`}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Voir les détails
                </a>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}