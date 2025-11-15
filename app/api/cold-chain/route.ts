import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';

export async function GET() {
  try {
    const pool = await getConnection();

    // Get temperature summary
    const summaryResult = await pool.request().query(`
      SELECT 
        COUNT(*) as totalReadings,
        AVG(Temperature) as avgTemp,
        MIN(Temperature) as minTemp,
        MAX(Temperature) as maxTemp,
        SUM(CASE WHEN Temperature < 2.0 OR Temperature > 4.0 THEN 1 ELSE 0 END) as violations
      FROM Warehouse.ColdRoomTemperatures_Archive
      WHERE RecordedWhen >= DATEADD(DAY, -7, GETDATE())
    `);

    // Get recent temperature readings
    const recentReadingsResult = await pool.request().query(`
      SELECT TOP 100
        ColdRoomSensorNumber,
        Temperature,
        RecordedWhen
      FROM Warehouse.ColdRoomTemperatures_Archive
      ORDER BY RecordedWhen DESC
    `);

    // Get temperature violations
    const violationsResult = await pool.request().query(`
      SELECT TOP 50
        ColdRoomSensorNumber,
        Temperature,
        RecordedWhen,
        CASE 
          WHEN Temperature < 2.0 THEN 'Too Cold'
          WHEN Temperature > 4.0 THEN 'Too Warm'
        END as violationType
      FROM Warehouse.ColdRoomTemperatures_Archive
      WHERE Temperature < 2.0 OR Temperature > 4.0
      ORDER BY RecordedWhen DESC
    `);

    // Get temperature by sensor (last 24 hours)
    const bySensorResult = await pool.request().query(`
      SELECT 
        ColdRoomSensorNumber,
        AVG(Temperature) as avgTemp,
        MIN(Temperature) as minTemp,
        MAX(Temperature) as maxTemp,
        COUNT(*) as readingCount,
        SUM(CASE WHEN Temperature < 2.0 OR Temperature > 4.0 THEN 1 ELSE 0 END) as violations
      FROM Warehouse.ColdRoomTemperatures_Archive
      WHERE RecordedWhen >= DATEADD(HOUR, -24, GETDATE())
      GROUP BY ColdRoomSensorNumber
      ORDER BY ColdRoomSensorNumber
    `);

    // Get hourly temperature trend (last 24 hours)
    const hourlyTrendResult = await pool.request().query(`
      SELECT 
        DATEPART(HOUR, RecordedWhen) as hour,
        AVG(Temperature) as avgTemp,
        MIN(Temperature) as minTemp,
        MAX(Temperature) as maxTemp
      FROM Warehouse.ColdRoomTemperatures_Archive
      WHERE RecordedWhen >= DATEADD(HOUR, -24, GETDATE())
      GROUP BY DATEPART(HOUR, RecordedWhen)
      ORDER BY hour
    `);

    // Get vehicle temperatures
    const vehicleTempResult = await pool.request().query(`
      SELECT TOP 50
        VehicleRegistration,
        Temperature,
        RecordedWhen,
        CASE 
          WHEN Temperature < 2.0 OR Temperature > 4.0 THEN 1
          ELSE 0
        END as isViolation
      FROM Warehouse.VehicleTemperatures
      ORDER BY RecordedWhen DESC
    `);

    return NextResponse.json({
      summary: summaryResult.recordset[0],
      recentReadings: recentReadingsResult.recordset,
      violations: violationsResult.recordset,
      bySensor: bySensorResult.recordset,
      hourlyTrend: hourlyTrendResult.recordset,
      vehicleTemperatures: vehicleTempResult.recordset,
    });
  } catch (error) {
    console.error('Error fetching cold chain data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cold chain data' },
      { status: 500 }
    );
  }
}