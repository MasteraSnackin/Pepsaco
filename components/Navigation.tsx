'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Database, Table, BarChart3, DollarSign, Package, Thermometer, Code, Brain, Settings } from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Home', icon: Database },
    { href: '/tables', label: 'Tables', icon: Table },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/sales', label: 'Sales', icon: DollarSign },
    { href: '/inventory', label: 'Inventory', icon: Package },
    { href: '/cold-chain', label: 'Cold Chain', icon: Thermometer },
    { href: '/insights', label: 'AI Insights', icon: Brain },
    { href: '/query-builder', label: 'Query Builder', icon: Code },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold text-blue-600">
              PepsaCo DB Viewer
            </Link>
            <div className="flex space-x-4">
              {links.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === href
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}