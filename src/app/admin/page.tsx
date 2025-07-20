import OrderDashboard from "@/components/OrderDashboar";

async function getOrders() {
    try {
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"}/api/orders`,
            {
                cache: "no-store",
            }
        );

        if (!res.ok) {
            throw new Error("Failed to fetch orders");
        }

        return res.json();
    } catch (error) {
        console.error("Error fetching orders:", error);
        return [];
    }
}

export default async function AdminPage() {
    const initialOrders = await getOrders();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900">Admin Dashboard</h2>
                    <p className="text-gray-600 mt-1">Monitor incoming orders in real-time</p>
                </div>

                <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-600">Live Updates</span>
                </div>
            </div>

            <OrderDashboard initialOrders={initialOrders} />
        </div>
    );
}
