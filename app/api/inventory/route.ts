import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';

export async function GET() {
  try {
    const pool = await getConnection();

    // Get inventory summary
    const summaryResult = await pool.request().query(`
      SELECT 
        COUNT(*) as totalItems,
        SUM(QuantityOnHand) as totalStock,
        SUM(CASE WHEN QuantityOnHand < ReorderLevel THEN 1 ELSE 0 END) as lowStockItems,
        SUM(CASE WHEN QuantityOnHand = 0 THEN 1 ELSE 0 END) as outOfStockItems
      FROM Warehouse.StockItemHoldings
    `);

    // Get low stock items
    const lowStockResult = await pool.request().query(`
      SELECT TOP 20
        si.StockItemName,
        sih.QuantityOnHand,
        sih.ReorderLevel,
        sih.LastStocktakeQuantity,
        (sih.ReorderLevel - sih.QuantityOnHand) as shortage
      FROM Warehouse.StockItems si
      JOIN Warehouse.StockItemHoldings sih ON si.StockItemID = sih.StockItemID
      WHERE sih.QuantityOnHand < sih.ReorderLevel
      ORDER BY (sih.ReorderLevel - sih.QuantityOnHand) DESC
    `);

    // Get recent stock movements
    const recentMovementsResult = await pool.request().query(`
      SELECT TOP 50
        si.StockItemName,
        sit.TransactionOccurredWhen,
        sit.Quantity,
        tt.TransactionTypeName,
        sit.Quantity * si.UnitPrice as value
      FROM Warehouse.StockItemTransactions sit
      JOIN Warehouse.StockItems si ON sit.StockItemID = si.StockItemID
      JOIN Application.TransactionTypes tt ON sit.TransactionTypeID = tt.TransactionTypeID
      ORDER BY sit.TransactionOccurredWhen DESC
    `);

    // Get stock by category
    const stockByCategoryResult = await pool.request().query(`
      SELECT 
        sg.StockGroupName as category,
        COUNT(DISTINCT si.StockItemID) as itemCount,
        SUM(sih.QuantityOnHand) as totalStock,
        SUM(sih.QuantityOnHand * si.UnitPrice) as totalValue
      FROM Warehouse.StockGroups sg
      JOIN Warehouse.StockItemStockGroups sisg ON sg.StockGroupID = sisg.StockGroupID
      JOIN Warehouse.StockItems si ON sisg.StockItemID = si.StockItemID
      JOIN Warehouse.StockItemHoldings sih ON si.StockItemID = sih.StockItemID
      GROUP BY sg.StockGroupName
      ORDER BY totalValue DESC
    `);

    // Get top moving items (by transaction count)
    const topMovingItemsResult = await pool.request().query(`
      SELECT TOP 10
        si.StockItemName,
        COUNT(*) as transactionCount,
        SUM(ABS(sit.Quantity)) as totalMovement,
        AVG(sih.QuantityOnHand) as avgStock
      FROM Warehouse.StockItemTransactions sit
      JOIN Warehouse.StockItems si ON sit.StockItemID = si.StockItemID
      JOIN Warehouse.StockItemHoldings sih ON si.StockItemID = sih.StockItemID
      WHERE sit.TransactionOccurredWhen >= DATEADD(MONTH, -3, GETDATE())
      GROUP BY si.StockItemName
      ORDER BY transactionCount DESC
    `);

    return NextResponse.json({
      summary: summaryResult.recordset[0],
      lowStockItems: lowStockResult.recordset,
      recentMovements: recentMovementsResult.recordset,
      stockByCategory: stockByCategoryResult.recordset,
      topMovingItems: topMovingItemsResult.recordset,
    });
  } catch (error) {
    console.error('Error fetching inventory data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory data' },
      { status: 500 }
    );
  }
}