'use client';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export function Orders() {
  const orders = [
    { id: '#1042', customer: 'Neha Patil', items: 'Blue kurta (M) × 1', amount: '₹1,299', status: 'Confirmed' },
    { id: '#1041', customer: 'Sundar Traders', items: 'Rice 25kg × 2', amount: '₹3,400', status: 'Confirmed' },
    { id: '#1040', customer: 'Meera Iyer', items: 'Face wash × 3', amount: '₹840', status: 'Payment pending' },
    { id: '#1039', customer: 'Rohit Shah', items: 'Formal shirt (L) × 2', amount: '₹2,198', status: 'Confirmed' },
  ];

  return (
    <div className="space-y-6">
      <div className="pb-6 border-b">
        <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
        <p className="text-sm text-muted-foreground mt-1">Orders taken by Aria across calls and WhatsApp.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-semibold">{order.id}</TableCell>
                  <TableCell>{order.customer}</TableCell>
                  <TableCell>{order.items}</TableCell>
                  <TableCell className="font-mono text-emerald-500">{order.amount}</TableCell>
                  <TableCell>
                    <Badge variant={order.status === 'Confirmed' ? 'default' : 'warning'}>
                      {order.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="text-xs text-muted-foreground p-4">Mock data — no /orders endpoint on the backend yet.</p>
        </CardContent>
      </Card>
    </div>
  );
}