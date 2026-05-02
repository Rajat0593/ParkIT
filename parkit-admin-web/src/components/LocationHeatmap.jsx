import React, { useEffect, useState } from 'react';
import {
  LineChart,
  BarChart,
  PieChart,
  ScatterChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

/**
 * Location Heatmap Component
 * Displays parking booking density across different areas
 */
export default function LocationHeatmap({ data = [] }) {
  const [heatmapData, setHeatmapData] = useState([]);
  const [topAreas, setTopAreas] = useState([]);

  useEffect(() => {
    if (data && data.length > 0) {
      processHeatmapData();
    }
  }, [data]);

  const processHeatmapData = () => {
    // Group bookings by area/location
    const areaMap = new Map();

    data.forEach((booking) => {
      const area = booking.space?.address?.split(',')[1]?.trim() || 'Unknown';
      const key = area;

      if (!areaMap.has(key)) {
        areaMap.set(key, {
          area,
          bookings: 0,
          revenue: 0,
          avgRating: 0,
          totalRating: 0,
          ratingCount: 0,
          latitude: booking.space?.latitude,
          longitude: booking.space?.longitude,
        });
      }

      const areaData = areaMap.get(key);
      areaData.bookings += 1;
      areaData.revenue += booking.total_price || 0;
      areaData.totalRating += booking.space?.rating || 0;
      areaData.ratingCount += 1;
      areaData.avgRating = areaData.totalRating / areaData.ratingCount;
    });

    // Convert to array and sort by bookings
    const processed = Array.from(areaMap.values())
      .sort((a, b) => b.bookings - a.bookings)
      .map((item, index) => ({
        ...item,
        id: index,
        density: Math.min(100, (item.bookings / Math.max(...Array.from(areaMap.values()).map(a => a.bookings))) * 100),
      }));

    setHeatmapData(processed);
    setTopAreas(processed.slice(0, 5));
  };

  const COLORS = ['#FF6B6B', '#FF8C42', '#FFC75F', '#4A90E2', '#28A745'];

  return {
    heatmapData,
    topAreas,
    COLORS,
  };
}

/**
 * Heatmap Grid Component
 * Visual representation of booking density
 */
export function HeatmapGrid({ data = [] }) {
  const getColor = (value, max) => {
    const intensity = value / max;
    if (intensity > 0.8) return '#FF6B6B'; // Red - Very High
    if (intensity > 0.6) return '#FF8C42'; // Orange - High
    if (intensity > 0.4) return '#FFC75F'; // Yellow - Medium
    if (intensity > 0.2) return '#4A90E2'; // Blue - Low
    return '#E0E0E0'; // Gray - Very Low
  };

  const maxBookings = Math.max(...data.map(d => d.bookings || 0), 1);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px' }}>
      {data.map((area) => (
        <div
          key={area.id}
          style={{
            backgroundColor: getColor(area.bookings, maxBookings),
            padding: '16px',
            borderRadius: '8px',
            color: '#fff',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
        >
          <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{area.area}</div>
          <div style={{ fontSize: '12px', marginTop: '4px' }}>
            {area.bookings} bookings
          </div>
          <div style={{ fontSize: '11px', opacity: 0.8 }}>
            ₹{(area.revenue / 1000).toFixed(0)}K
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Top Areas Chart
 * Bar chart showing top 5 areas by bookings
 */
export function TopAreasChart({ data = [] }) {
  const topAreas = data.slice(0, 5);
  const COLORS = ['#FF6B6B', '#FF8C42', '#FFC75F', '#4A90E2', '#28A745'];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={topAreas}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="area" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="bookings" fill="#4A90E2" name="Bookings" />
        <Bar dataKey="revenue" fill="#28A745" name="Revenue (₹)" />
      </BarChart>
    </ResponsiveContainer>
  );
}

/**
 * Area Distribution Pie Chart
 */
export function AreaDistributionChart({ data = [] }) {
  const topAreas = data.slice(0, 8);
  const COLORS = ['#FF6B6B', '#FF8C42', '#FFC75F', '#4A90E2', '#28A745', '#9B59B6', '#1ABC9C', '#E67E22'];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Tooltip />
        <Legend />
        {topAreas.length > 0 && (
          <PieChart
            data={topAreas}
            margin={{ top: 20, right: 80, bottom: 20, left: 80 }}
          >
            <Tooltip />
            <Legend />
          </PieChart>
        )}
      </PieChart>
    </ResponsiveContainer>
  );
}

/**
 * Peak Hours Analysis
 */
export function PeakHoursAnalysis({ bookings = [] }) {
  // Group bookings by hour
  const hourMap = new Map();

  bookings.forEach((booking) => {
    const hour = new Date(booking.check_in_time).getHours();
    hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
  });

  // Create 24-hour array
  const hourData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    bookings: hourMap.get(i) || 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={hourData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="hour" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="bookings" stroke="#4A90E2" name="Bookings" />
      </LineChart>
    </ResponsiveContainer>
  );
}

/**
 * Clustering Analysis
 * Shows clustering of parking spaces in different areas
 */
export function ClusteringAnalysis({ spaces = [] }) {
  // Group spaces by area
  const areaMap = new Map();

  spaces.forEach((space) => {
    const area = space.address?.split(',')[1]?.trim() || 'Unknown';
    if (!areaMap.has(area)) {
      areaMap.set(area, []);
    }
    areaMap.get(area).push(space);
  });

  // Create scatter data
  const clusterData = Array.from(areaMap.entries()).map(([area, spaces], index) => ({
    area,
    latitude: spaces[0].latitude,
    longitude: spaces[0].longitude,
    count: spaces.length,
    id: index,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="latitude" name="Latitude" />
        <YAxis dataKey="longitude" name="Longitude" />
        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
        <Legend />
        {clusterData.length > 0 && (
          <ScatterChart data={clusterData}>
            {clusterData.map((item, index) => (
              <div key={item.id}>{item.area}: {item.count} spaces</div>
            ))}
          </ScatterChart>
        )}
      </ScatterChart>
    </ResponsiveContainer>
  );
}

export default LocationHeatmap;
