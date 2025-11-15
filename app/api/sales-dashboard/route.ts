import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';

export async function GET() {
  try {
    const pool = await getConnection();

    // Get total revenue
    const revenueResult = await pool.request().query(`
      SELECT 
        SUM(ol.Quantity * ol.UnitPrice) as totalRevenue,
        COUNT(DISTINCT o.OrderID) as totalOrders,
        COUNT(DISTINCT o.CustomerID) as totalCustomers
      FROM Sales.Orders o
      JOIN Sales.OrderLines ol ON o.OrderID = ol.OrderID
    `);

    // Get monthly revenue trend (last 12 months)
    const monthlyTrendResult = await pool.request().query(`
      SELECT TOP 12
        FORMAT(o.OrderDate, 'yyyy-MM') as month,
        SUM(ol.Quantity * ol.UnitPrice) as revenue,
        COUNT(DISTINCT o.OrderID) as orders
      FROM Sales.Orders o
      JOIN Sales.OrderLines ol ON o.OrderID = ol.OrderID
      WHERE o.OrderDate >= DATEADD(MONTH, -12, GETDATE())
      GROUP BY FORMAT(o.OrderDate, 'yyyy-MM')
      ORDER BY month DESC
    `);

    // Get top 10 customers by revenue
    const topCustomersResult = await pool.request().query(`
      SELECT TOP 10
        c.CustomerName,
        SUM(ol.Quantity * ol.UnitPrice) as totalRevenue,
        COUNT(DISTINCT o.OrderID) as orderCount
      FROM Sales.Customers c
      JOIN Sales.Orders o ON c.CustomerID = o.CustomerID
      JOIN Sales.OrderLines ol ON o.OrderID = ol.OrderID
      GROUP BY c.CustomerName
      ORDER BY totalRevenue DESC
    `);

    // Get top 10 products by revenue
    const topProductsResult = await pool.request().query(`
      SELECT TOP 10
        si.StockItemName as productName,
        SUM(ol.Quantity * ol.UnitPrice) as totalRevenue,
        SUM(ol.Quantity) as totalQuantity
      FROM Sales.OrderLines ol
      JOIN Warehouse.StockItems si ON ol.StockItemID = si.StockItemID
      GROUP BY si.StockItemName
      ORDER BY totalRevenue DESC
    `);

    // Get sales by category
    const salesByCategoryResult = await pool.request().query(`
      SELECT 
        cc.CustomerCategoryName as category,
        SUM(ol.Quantity * ol.UnitPrice) as revenue,
        COUNT(DISTINCT o.OrderID) as orders
      FROM Sales.CustomerCategories cc
      JOIN Sales.Customers c ON cc.CustomerCategoryID = c.CustomerCategoryID
      JOIN Sales.Orders o ON c.CustomerID = o.CustomerID
      JOIN Sales.OrderLines ol ON o.OrderID = ol.OrderID
      GROUP BY cc.CustomerCategoryName
      ORDER BY revenue DESC
    `);

    // Get average order value
    const avgOrderValueResult = await pool.request().query(`
      SELECT 
        AVG(orderTotal) as avgOrderValue
      FROM (
        SELECT 
          o.OrderID,
          SUM(ol.Quantity * ol.UnitPrice) as orderTotal
        FROM Sales.Orders o
        JOIN Sales.OrderLines ol ON o.OrderID = ol.OrderID
        GROUP BY o.OrderID
      ) as OrderTotals
    `);

    return NextResponse.json({
      summary: {
        totalRevenue: revenueResult.recordset[0].totalRevenue || 0,
        totalOrders: revenueResult.recordset[0].totalOrders || 0,
        totalCustomers: revenueResult.recordset[0].totalCustomers || 0,
        avgOrderValue: avgOrderValueResult.recordset[0].avgOrderValue || 0,
      },
      monthlyTrend: monthlyTrendResult.recordset.reverse(),
      topCustomers: topCustomersResult.recordset,
      topProducts: topProductsResult.recordset,
      salesByCategory: salesByCategoryResult.recordset,
    });
  } catch (error) {
    console.error('Error fetching sales dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales dashboard data' },
      { status: 500 }
    );
  }
}