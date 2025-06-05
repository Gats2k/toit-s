"use client"

import { useState, useEffect } from 'react';
import { Coordinates, LocationError } from './types';

interface GeolocationHookResult {
  coordinates: Coordinates | null;
  error: LocationError | null;
  loading: boolean;
  getLocation: () => void;
}

export function useGeolocation(): GeolocationHookResult {
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [error, setError] = useState<LocationError | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSuccess = (position: GeolocationPosition) => {
    const { latitude, longitude, accuracy } = position.coords;
    setCoordinates({ latitude, longitude, accuracy });
    setLoading(false);
    setError(null);
  };

  const handleError = (error: GeolocationPositionError) => {
    setError({
      code: error.code,
      message: error.message,
    });
    setLoading(false);
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      setError({
        code: 0,
        message: 'Geolocation is not supported by your browser',
      });
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      handleError,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  useEffect(() => {
    getLocation();
  }, []);

  return { coordinates, error, loading, getLocation };
}

// Hook for watching position changes
export function useWatchPosition(): GeolocationHookResult {
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [error, setError] = useState<LocationError | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError({
        code: 0,
        message: 'Geolocation is not supported by your browser',
      });
      return;
    }

    setLoading(true);

    const handleSuccess = (position: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = position.coords;
      setCoordinates({ latitude, longitude, accuracy });
      setLoading(false);
      setError(null);
    };

    const handleError = (error: GeolocationPositionError) => {
      setError({
        code: error.code,
        message: error.message,
      });
      setLoading(false);
    };

    const watchId = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  const getLocation = () => {
    if (!navigator.geolocation) {
      setError({
        code: 0,
        message: 'Geolocation is not supported by your browser',
      });
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setCoordinates({ latitude, longitude, accuracy });
        setLoading(false);
        setError(null);
      },
      (error) => {
        setError({
          code: error.code,
          message: error.message,
        });
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return { coordinates, error, loading, getLocation };
}