import OrderForm from "@/components/OrderForm";

export default function Home() {
    return (
        <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Place Your Order</h2>
                <p className="text-gray-600 text-lg">Fill out the form below to place your order</p>
            </div>

            <div className="card">
                <OrderForm />
            </div>
        </div>
    );
}
