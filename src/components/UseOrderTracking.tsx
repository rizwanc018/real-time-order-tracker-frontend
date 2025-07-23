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
    items: OrderItem[];
    totalAmount: number;
    createdAt: string;
    status: OrderStatus;
};

type UserOrderTrackingProps = {
    customerName: string;
    onBack?: () => void;
};

const STATUS_STEPS = [
    { key: "pending", label: "Order Placed", icon: "📝" },
    { key: "confirmed", label: "Confirmed", icon: "✅" },
    { key: "preparing", label: "Preparing", icon: "👨‍🍳" },
    { key: "completed", label: "Ready", icon: "🎉" },
];

export default function UserOrderTracking({ customerName, onBack }: UserOrderTrackingProps) {
    const [userOrders, setUserOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { socket, isConnected } = useSocket();

    // Fetch user's orders
    useEffect(() => {
        const fetchUserOrders = async () => {
            try {
                setLoading(true);
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/orders?customerName=${encodeURIComponent(
                        customerName
                    )}`
                );

                if (!res.ok) {
                    throw new Error("Failed to fetch orders");
                }

                const allOrders = await res.json();
                // Filter orders for this customer
                const filteredOrders = allOrders.filter(
                    (order: Order) => order.customerName.toLowerCase() === customerName.toLowerCase()
                );

                setUserOrders(filteredOrders);
            } catch (err) {
                setError("Failed to load your orders. Please try again.");
                console.error("Error fetching user orders:", err);
            } finally {
                setLoading(false);
            }
        };

        if (customerName) {
            fetchUserOrders();
        }
    }, [customerName]);

    // Listen for real-time order updates
    useEffect(() => {
        if (!socket || !customerName) return;
        
        socket.emit("joinOrderRoom", customerName.toLowerCase());

        const handleOrderUpdate = (updatedOrder: Order) => {
            console.log("🚀 ~ handleOrderUpdate ~ updatedOrder", updatedOrder)

            // Only update if this order belongs to the current user
            if (updatedOrder.customerName.toLowerCase() === customerName.toLowerCase()) {
                setUserOrders((prev) =>
                    prev.map((order) => (order.id === updatedOrder.id ? updatedOrder : order))
                );

                // Show notification for status updates
                showStatusNotification(updatedOrder.status);
            }
        };

        socket.on("orderUpdated", handleOrderUpdate);

        return () => {
            socket.off("orderUpdated", handleOrderUpdate);
        };
    }, [socket, customerName]);

    const showStatusNotification = (status: OrderStatus) => {
        const statusMessages = {
            pending: "Your order has been placed!",
            confirmed: "Your order has been confirmed!",
            preparing: "Your order is being prepared!",
            completed: "Your order is ready for pickup!",
        };

        const notification = document.createElement("div");
        notification.className =
            "fixed top-4 right-4 px-6 py-3 rounded-lg text-sm text-white z-50 animate-slide-up bg-green-500 shadow-lg";
        notification.innerHTML = `
            <div class="flex items-center space-x-2">
                <span class="text-lg">${STATUS_STEPS.find((s) => s.key === status)?.icon || "🔔"}</span>
                <span class="font-medium">${statusMessages[status]}</span>
            </div>
        `;
        document.body.appendChild(notification);

        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 5000);
    };

    const getStatusIndex = (status: OrderStatus): number => {
        return STATUS_STEPS.findIndex((step) => step.key === status);
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleString();
    };

    if (loading) {
        return (
            <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading your orders...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg">
                    <p>{error}</p>
                </div>
                {onBack && (
                    <button onClick={onBack} className="mt-4 btn-primary">
                        Go Back
                    </button>
                )}
            </div>
        );
    }

    if (userOrders.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600 text-lg">No orders found for {customerName}</p>
                <p className="text-gray-500 text-sm mt-2">Place an order to track its status here!</p>
                {onBack && (
                    <button onClick={onBack} className="mt-4 btn-primary">
                        Place an Order
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Connection Status */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Your Orders</h2>
                <div
                    className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                        isConnected ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}
                >
                    <div
                        className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
                    ></div>
                    <span>{isConnected ? "Live Updates" : "Reconnecting..."}</span>
                </div>
            </div>

            {/* Orders List */}
            <div className="space-y-6">
                {userOrders.map((order) => {
                    const currentStatusIndex = getStatusIndex(order.status);

                    return (
                        <div
                            key={order.id}
                            className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm"
                        >
                            {/* Order Header */}
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Order #{order.id.slice(-6).toUpperCase()}
                                    </h3>
                                    <p className="text-sm text-gray-600">{formatDate(order.createdAt)}</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-bold text-gray-900">
                                        ${order.totalAmount.toFixed(2)}
                                    </div>
                                </div>
                            </div>

                            {/* Status Progress */}
                            <div className="mb-6">
                                <div className="flex justify-between relative">
                                    {STATUS_STEPS.map((step, index) => (
                                        <div
                                            key={step.key}
                                            className="flex flex-col items-center relative z-10"
                                        >
                                            <div
                                                className={`w-12 h-12 rounded-full flex items-center justify-center text-lg ${
                                                    index <= currentStatusIndex
                                                        ? "bg-green-500 text-white"
                                                        : "bg-gray-200 text-gray-500"
                                                }`}
                                            >
                                                {step.icon}
                                            </div>
                                            <div
                                                className={`mt-2 text-sm font-medium ${
                                                    index <= currentStatusIndex
                                                        ? "text-green-600"
                                                        : "text-gray-500"
                                                }`}
                                            >
                                                {step.label}
                                            </div>
                                            {index === currentStatusIndex && (
                                                <div className="absolute -bottom-2 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                            )}
                                        </div>
                                    ))}
                                    {/* Progress Line */}
                                    <div className="absolute top-6 left-6 right-6 h-0.5 bg-gray-200 -z-10">
                                        <div
                                            className="h-full bg-green-500 transition-all duration-500"
                                            style={{
                                                width: `${
                                                    (currentStatusIndex / (STATUS_STEPS.length - 1)) * 100
                                                }%`,
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            {/* Order Items */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h4 className="font-medium text-gray-700 mb-3">Order Items</h4>
                                <div className="space-y-2">
                                    {order.items.map((item, index) => (
                                        <div key={index} className="flex justify-between text-sm">
                                            <span>
                                                {item.quantity}x {item.name}
                                            </span>
                                            <span className="font-medium">
                                                ${(item.price * item.quantity).toFixed(2)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Current Status Message */}
                            <div
                                className={`mt-4 p-3 rounded-lg ${
                                    order.status === "completed"
                                        ? "bg-green-100 border border-green-200 text-green-800"
                                        : "bg-blue-100 border border-blue-200 text-blue-800"
                                }`}
                            >
                                <div className="flex items-center space-x-2">
                                    <span className="text-lg">
                                        {STATUS_STEPS.find((s) => s.key === order.status)?.icon}
                                    </span>
                                    <span className="font-medium">
                                        {order.status === "completed"
                                            ? "Your order is ready for pickup!"
                                            : `Your order is currently being ${
                                                  order.status === "preparing" ? "prepared" : order.status
                                              }`}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {onBack && (
                <div className="text-center">
                    <button onClick={onBack} className="btn-secondary">
                        Place Another Order
                    </button>
                </div>
            )}
        </div>
    );
}
