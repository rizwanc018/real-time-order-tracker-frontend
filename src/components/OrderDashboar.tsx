"use client";

import { useEffect, useState } from "react";
import { useSocket } from "./SocketProvider";

type OrderItem = {
    name: string;
    price: number;
    quantity: number;
};

type OrderStatus = "pending" | "confirmed" | "preparing" | "completed";

type Order = {
    id: string;
    customerName: string;
    customerEmail?: string;
    items: OrderItem[];
    totalAmount: number;
    createdAt: string;
    status: OrderStatus;
};

type OrderDashboardProps = {
    initialOrders: Order[];
};

const STATUS_OPTIONS: OrderStatus[] = ["pending", "confirmed", "preparing", "completed"];

export default function OrderDashboard({ initialOrders }: OrderDashboardProps) {
    const [orders, setOrders] = useState<Order[]>(initialOrders);
    const [filter, setFilter] = useState<"all" | OrderStatus>("all");
    const { socket, isConnected } = useSocket();

    useEffect(() => {
        if (!socket) return;

        socket.emit("joinAdmin");

        socket.on("newOrder", (newOrder: Order) => {
            setOrders((prev) => [newOrder, ...prev]);
            showNotification("New order received!", "success");
        });

        socket.on("orderUpdated", (updatedOrder: Order) => {
            setOrders((prev) => prev.map((order) => (order.id === updatedOrder.id ? updatedOrder : order)));
            showNotification("Order status updated", "info");
        });

        return () => {
            socket.off("newOrder");
            socket.off("orderUpdated");
        };
    }, [socket]);

    const showNotification = (message: string, type: "success" | "info") => {
        const notification = document.createElement("div");
        notification.className = `fixed top-4 right-4 px-4 py-2 rounded-lg text-white z-50 animate-slide-up ${
            type === "success" ? "bg-green-500" : "bg-blue-500"
        }`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            document.body.removeChild(notification);
        }, 3000);
    };

    const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"}/api/orders/${orderId}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: newStatus }),
                }
            );

            if (!res.ok) {
                throw new Error("Failed to update order status");
            }
        } catch (error) {
            console.error("Error updating order status:", error);
            alert("Failed to update order status");
        }
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleString();
    };

    const getStatusBadgeClass = (status: OrderStatus): string => {
        return `status-badge status-${status}`;
    };

    const filteredOrders = filter === "all" ? orders : orders.filter((order) => order.status === filter);

    const orderStats = {
        total: orders.length,
        pending: orders.filter((o) => o.status === "pending").length,
        confirmed: orders.filter((o) => o.status === "confirmed").length,
        preparing: orders.filter((o) => o.status === "preparing").length,
        completed: orders.filter((o) => o.status === "completed").length,
    };

    return (
        <div className="space-y-6">
            {/* Connection Status */}
            <div
                className={`p-3 rounded-lg ${
                    isConnected ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                } border`}
            >
                <div className="flex items-center space-x-2">
                    <div
                        className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
                    ></div>
                    <span className="text-sm font-medium">
                        {isConnected
                            ? "Connected - Real-time updates active"
                            : "Disconnected - Trying to reconnect..."}
                    </span>
                </div>
            </div>

            {/* Order Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="text-2xl font-bold text-gray-900">{orderStats.total}</div>
                    <div className="text-sm text-gray-600">Total Orders</div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="text-2xl font-bold text-yellow-600">{orderStats.pending}</div>
                    <div className="text-sm text-gray-600">Pending</div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="text-2xl font-bold text-blue-600">{orderStats.confirmed}</div>
                    <div className="text-sm text-gray-600">Confirmed</div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="text-2xl font-bold text-orange-600">{orderStats.preparing}</div>
                    <div className="text-sm text-gray-600">Preparing</div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="text-2xl font-bold text-green-600">{orderStats.completed}</div>
                    <div className="text-sm text-gray-600">Completed</div>
                </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2">
                {(["all", ...STATUS_OPTIONS] as const).map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            filter === status
                                ? "bg-blue-600 text-white"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                    >
                        {status === "all" ? "All Orders" : status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                ))}
            </div>

            {/* Orders List */}
            <div className="space-y-4">
                {filteredOrders.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                        <p className="text-gray-500 text-lg">No orders found</p>
                        <p className="text-gray-400 text-sm mt-2">
                            {filter === "all" ? "No orders have been placed yet" : `No ${filter} orders`}
                        </p>
                    </div>
                ) : (
                    filteredOrders.map((order) => (
                        <div key={order.id} className="card animate-fade-in">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                <div className="flex-1 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                {order.customerName}
                                            </h3>
                                            {order.customerEmail && (
                                                <p className="text-sm text-gray-600">{order.customerEmail}</p>
                                            )}
                                        </div>
                                        <span className={getStatusBadgeClass(order.status)}>
                                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                        </span>
                                    </div>

                                    <div className="space-y-2">
                                        <h4 className="font-medium text-gray-700">Items:</h4>
                                        <div className="space-y-1">
                                            {order.items.map((item, index) => (
                                                <div key={index} className="flex justify-between text-sm">
                                                    <span>
                                                        {item.quantity}x {item.name}
                                                    </span>
                                                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                                        <span className="text-sm text-gray-600">
                                            {formatDate(order.createdAt)}
                                        </span>
                                        <span className="text-lg font-bold text-gray-900">
                                            Total: ${order.totalAmount.toFixed(2)}
                                        </span>
                                    </div>
                                </div>

                                <div className="lg:ml-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Update Status
                                    </label>
                                    <select
                                        value={order.status}
                                        onChange={(e) =>
                                            updateOrderStatus(order.id, e.target.value as OrderStatus)
                                        }
                                        className="input-field min-w-[140px]"
                                    >
                                        {STATUS_OPTIONS.map((status) => (
                                            <option key={status} value={status}>
                                                {status.charAt(0).toUpperCase() + status.slice(1)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
