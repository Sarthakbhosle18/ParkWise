"use client";

import { useEffect, useRef, useState } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ParkingArea {
    id: number;
    name: string;
    address: string;
    city: string;
    latitude: number;
    longitude: number;
    distance: number;
    hourlyRate: number;
    dailyRate: number;
    availableSlots: number;
    totalSlots: number;
}

interface MapComponentProps {
    userLocation: { lat: number; lng: number } | null;
    filteredParking: ParkingArea[];
    showAllCities: boolean;
}

export default function MapComponent({ userLocation, filteredParking, showAllCities }: MapComponentProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const [mapError, setMapError] = useState<string | null>(null);
    const [isInitializing, setIsInitializing] = useState(true);

    const mapInstanceRef = useRef<google.maps.Map | null>(null);
    const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
    const userMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
    const initializedRef = useRef(false);

    useEffect(() => {
        let isMounted = true;

        const initMap = async () => {
            if (!mapRef.current || !userLocation) return;

            if (mapInstanceRef.current) {
                // Map is already initialized, just update center/zoom
                mapInstanceRef.current.setCenter(userLocation);
                mapInstanceRef.current.setZoom(showAllCities ? 6 : 13);
                if (userMarkerRef.current) {
                    userMarkerRef.current.position = userLocation;
                }
                return;
            }

            setIsInitializing(true);
            setMapError(null);

            const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
            if (!apiKey) {
                if (isMounted) setMapError("Map configuration missing. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.");
                if (isMounted) setIsInitializing(false);
                return;
            }

            try {
                setOptions({
                    key: apiKey,
                    v: "weekly",
                });

                const { Map, InfoWindow } = await importLibrary("maps") as google.maps.MapsLibrary;
                const { AdvancedMarkerElement, PinElement } = await importLibrary("marker") as google.maps.MarkerLibrary;

                if (!isMounted) return;

                // Initialize Map
                const map = new Map(mapRef.current, {
                    center: userLocation,
                    zoom: showAllCities ? 6 : 13,
                    mapId: "DEMO_MAP_ID", // Required for AdvancedMarkerElement
                    mapTypeControl: true,
                    streetViewControl: false,
                    fullscreenControl: true,
                    zoomControl: true,
                });

                mapInstanceRef.current = map;

                // Add User Location Marker
                const userPin = new PinElement({
                    background: "#3B82F6",
                    borderColor: "#2563EB",
                    glyphColor: "white",
                    scale: 1.2,
                });

                userMarkerRef.current = new AdvancedMarkerElement({
                    map,
                    position: userLocation,
                    title: "Your Location",
                    content: userPin.element,
                    zIndex: 1000,
                });

                // Add Parking Area Markers
                updateMarkers(filteredParking, map, InfoWindow, AdvancedMarkerElement, PinElement);

                if (isMounted) setIsInitializing(false);
            } catch (error) {
                console.error("Map initialization error:", error);
                if (isMounted) {
                    setMapError(`Failed to load Google Maps: ${error instanceof Error ? error.message : String(error)}`);
                    setIsInitializing(false);
                }
            }
        };

        initMap().catch(console.error);

        return () => {
            isMounted = false;
        };
    }, [userLocation, showAllCities]); // Re-initialize map if base properties change

    // Separate effect for just updating markers when filters change without re-initializing map
    useEffect(() => {
        if (!mapInstanceRef.current || isInitializing || !window.google?.maps?.marker) return;

        try {
            const map = mapInstanceRef.current;
            const InfoWindow = window.google.maps.InfoWindow;
            const AdvancedMarkerElement = window.google.maps.marker.AdvancedMarkerElement;
            const PinElement = window.google.maps.marker.PinElement;

            updateMarkers(filteredParking, map, InfoWindow as any, AdvancedMarkerElement, PinElement);
        } catch (e) {
            console.error("Failed to update markers:", e);
        }
    }, [filteredParking, isInitializing]);

    const updateMarkers = (
        areas: ParkingArea[],
        map: google.maps.Map,
        InfoWindow: typeof google.maps.InfoWindow,
        AdvancedMarkerElement: typeof google.maps.marker.AdvancedMarkerElement,
        PinElement: typeof google.maps.marker.PinElement
    ) => {
        // Clear existing parking markers
        markersRef.current.forEach(m => { m.map = null; });
        markersRef.current = [];

        const activeInfoWindow = new InfoWindow();

        areas.forEach(area => {
            const isAvailable = area.availableSlots > 0;

            const pin = new PinElement({
                background: isAvailable ? "#10b981" : "#ef4444",
                borderColor: "white",
                glyphColor: "white",
            });

            const marker = new AdvancedMarkerElement({
                map,
                position: { lat: area.latitude, lng: area.longitude },
                title: area.name,
                content: pin.element,
            });

            marker.addListener("click", () => {
                const content = `
          <div style="padding: 12px; min-width: 220px; font-family: system-ui, -apple-system, sans-serif;">
            <h3 style="font-weight: bold; margin-bottom: 8px; font-size: 16px; color: #1f2937;">${area.name}</h3>
            <p style="font-size: 12px; color: #6b7280; margin-bottom: 4px;"><strong>City:</strong> ${area.city}</p>
            <p style="font-size: 13px; color: #6b7280; margin-bottom: 8px;">${area.address}</p>
            <div style="background: #f3f4f6; padding: 8px; border-radius: 6px; margin-bottom: 12px;">
              <p style="font-size: 13px; margin: 4px 0; color: #374151;"><strong>Available:</strong> ${area.availableSlots}/${area.totalSlots} slots</p>
              <p style="font-size: 13px; margin: 4px 0; color: #374151;"><strong>Price:</strong> ₹${area.hourlyRate}/hr • ₹${area.dailyRate}/day</p>
              <p style="font-size: 13px; margin: 4px 0; color: #6b7280;"><strong>Distance:</strong> ${area.distance.toFixed(1)} km away</p>
            </div>
            <a 
              href="/driver/parking/${area.id}" 
              style="
                display: block;
                width: 100%;
                padding: 8px 16px;
                background-color: ${isAvailable ? '#2563eb' : '#9ca3af'};
                color: white;
                text-align: center;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                font-size: 14px;
                transition: background-color 0.2s;
                ${!isAvailable ? 'cursor: not-allowed; opacity: 0.6;' : 'cursor: pointer;'}
              "
              ${!isAvailable ? 'onclick="return false;"' : ''}
            >
              ${isAvailable ? '🅿️ Book Slot' : 'No Slots Available'}
            </a>
          </div>
        `;

                activeInfoWindow.setContent(content);
                activeInfoWindow.open({
                    anchor: marker,
                    map,
                });
            });

            markersRef.current.push(marker);
        });
    };

    return (
        <div className="relative w-full h-[500px] rounded-lg mb-6 border border-border overflow-hidden bg-muted">
            {isInitializing && !mapError && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/90 z-10">
                    <div className="text-center">
                        <Loader2 className="h-12 w-12 text-primary mx-auto mb-2 animate-spin" />
                        <p className="text-sm text-muted-foreground">Initializing map...</p>
                    </div>
                </div>
            )}

            {mapError && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/95 z-10">
                    <div className="text-center p-6">
                        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                        <h3 className="font-semibold mb-2">Map Unavailable</h3>
                        <p className="text-sm text-muted-foreground mb-3">{mapError}</p>
                        <p className="text-xs text-muted-foreground mb-3">You can still view and book parking from the list below</p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setMapError(null);
                                setIsInitializing(true);
                                // Simple state toggle to force effect re-run if we wanted a reload function passed from parent
                                window.location.reload();
                            }}
                        >
                            Reload Page
                        </Button>
                    </div>
                </div>
            )}

            <div ref={mapRef} className="w-full h-full"></div>
        </div>
    );
}
