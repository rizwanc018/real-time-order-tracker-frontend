"use client";

import { useState } from "react";
import UserOrderTracking from "@/components/UseOrderTracking";

type MenuItem = {
    id: number;
    name: string;
    price: number;
};

type SelectedItem = MenuItem & {
    quantity: number;
};

const MENU_ITEMS: MenuItem[] = [
    { id: 1, name: "Pizza Margherita", price: 12.99 },
    { id: 2, name: "Chicken Burger", price: 9.99 },
    { id: 3, name: "Caesar Salad", price: 8.5 },
    { id: 4, name: "Pasta Carbonara", price: 11.99 },
    { id: 5, name: "Fish & Chips", price: 13.5 },
    { id: 6, name: "Chocolate Cake", price: 6.99 },
];

type ViewMode = "order" | "track" | "success";

export default function OrderForm() {
    const [customerName, setCustomerName] = useState<string>("");
    const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [viewMode, setViewMode] = useState<ViewMode>("order");
    const [trackingName, setTrackingName] = useState<string>("");

    const addItem = (menuItem: MenuItem) => {
        const existingItem = selectedItems.find((item) => item.id === menuItem.id);
        if (existingItem) {
            setSelectedItems(
                selectedItems.map((item) =>
                    item.id === menuItem.id ? { ...item, quantity: item.quantity + 1 } : item
                )
            );
        } else {
            setSelectedItems([...selectedItems, { ...menuItem, quantity: 1 }]);
        }
    };

    const removeItem = (itemId: number) => {
        setSelectedItems(selectedItems.filter((item) => item.id !== itemId));
    };

    const updateQuantity = (itemId: number, quantity: string | number) => {
        const qty = Number(quantity);
        if (qty <= 0 || isNaN(qty)) {
            removeItem(itemId);
            return;
        }

        setSelectedItems(
            selectedItems.map((item) => (item.id === itemId ? { ...item, quantity: qty } : item))
        );
    };

    const getTotalAmount = (): number => {
        return selectedItems.reduce((total, item) => total + item.price * item.quantity, 0);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!customerName.trim() || selectedItems.length === 0) {
            alert("Please fill in your name and select at least one item");
            return;
        }

        setIsSubmitting(true);

        try {
            const orderData = {
                customerName: customerName.trim(),
                items: selectedItems,
                totalAmount: getTotalAmount(),
            };

            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"}/api/orders`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(orderData),
                }
            );

            if (!res.ok) {
                throw new Error("Failed to place order");
            }

            setTrackingName(customerName.trim());
            setViewMode("success");
            setSelectedItems([]);
        } catch (error) {
            console.error("Error placing order:", error);
            alert("Failed to place order. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleTrackOrder = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!trackingName.trim()) {
            alert("Please enter your name to track orders");
            return;
        }
        setViewMode("track");
    };

    const resetToOrderForm = () => {
        setViewMode("order");
        setCustomerName("");
        setTrackingName("");
        setSelectedItems([]);
    };

    // Success View
    if (viewMode === "success") {
        return (
            <div className="text-center py-12 animate-fade-in">
                <div className="bg-green-100 border border-green-400 text-green-700 px-6 py-4 rounded-lg mb-6">
                    <h3 className="text-lg font-semibold">Order Placed Successfully!</h3>
                    <p>Thank you for your order, {trackingName}. We will start preparing it right away.</p>
                </div>

                <div className="space-x-4">
                    <button onClick={() => setViewMode("track")} className="btn-primary">
                        Track My Order
                    </button>
                    <button onClick={resetToOrderForm} className="btn-secondary">
                        Place Another Order
                    </button>
                </div>
            </div>
        );
    }

    // Order Tracking View
    if (viewMode === "track") {
        return (
            <div className="animate-fade-in">
                <UserOrderTracking customerName={trackingName} onBack={resetToOrderForm} />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Place Your Order</h2>
                <p className="text-gray-600 text-lg">Fill out the form below to place your order</p>
            </div>
            {/* Navigation Tabs */}
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                <button
                    onClick={() => setViewMode("order")}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                        viewMode === "order"
                            ? "bg-white text-blue-600 shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                    }`}
                >
                    Place Order
                </button>
                <button
                    onClick={() => setViewMode("track")}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                        viewMode !== "order"
                            ? "bg-white text-blue-600 shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                    }`}
                >
                    Track Order
                </button>
            </div>

            {viewMode === "order" && !customerName && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <h4 className="font-medium text-blue-900 mb-2">Want to track an existing order?</h4>
                    <form onSubmit={handleTrackOrder} className="flex gap-2">
                        <input
                            type="text"
                            value={trackingName}
                            onChange={(e) => setTrackingName(e.target.value)}
                            className="input-field flex-1"
                            placeholder="Enter your name"
                        />
                        <button type="submit" className="btn-secondary whitespace-nowrap">
                            Track Order
                        </button>
                    </form>
                </div>
            )}

            {/* Order Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Customer Info */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800">Customer Information</h3>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                        <input
                            type="text"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className="input-field"
                            placeholder="Enter your name"
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">Use this name to track your order status</p>
                    </div>
                </div>

                {/* Menu Items */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800">Select Items</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {MENU_ITEMS.map((item) => (
                            <div
                                key={item.id}
                                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-medium text-gray-800">{item.name}</h4>
                                    <span className="text-blue-600 font-semibold">
                                        ${item.price.toFixed(2)}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => addItem(item)}
                                    className="btn-secondary w-full"
                                >
                                    Add to Order
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Selected Items */}
                {selectedItems.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800">Your Order</h3>

                        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                            {selectedItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between bg-white p-3 rounded-lg"
                                >
                                    <div className="flex-1">
                                        <h4 className="font-medium text-gray-800">{item.name}</h4>
                                        <p className="text-sm text-gray-600">${item.price.toFixed(2)} each</p>
                                    </div>

                                    <div className="flex items-center space-x-3">
                                        <input
                                            type="number"
                                            min="1"
                                            value={item.quantity}
                                            onChange={(e) => updateQuantity(item.id, e.target.value)}
                                            className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                                        />
                                        <span className="font-semibold text-gray-800 w-16 text-right">
                                            ${(item.price * item.quantity).toFixed(2)}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => removeItem(item.id)}
                                            className="text-red-500 hover:text-red-700 p-1"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            ))}

                            <div className="border-t pt-3 mt-3">
                                <div className="flex justify-between items-center text-lg font-semibold">
                                    <span>Total:</span>
                                    <span className="text-blue-600">${getTotalAmount().toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isSubmitting || selectedItems.length === 0}
                    className="btn-primary w-full text-lg py-4"
                >
                    {isSubmitting ? "Placing Order..." : `Place Order - $${getTotalAmount().toFixed(2)}`}
                </button>
            </form>
        </div>
    );
}
