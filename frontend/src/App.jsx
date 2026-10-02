import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:5000";

const USER_ID = "waitlist-fresh-test-user";

const PRODUCT_ID = "fe539a42-ae92-4647-bbc1-691bb1bf53b7";

function App() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);

  const fetchStatus = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/sale/status?userId=${USER_ID}&productId=${PRODUCT_ID}`,
      );

      const data = await response.json();

      console.log("Status response:", response.status);

      console.log("Status data:", data);

      setStatus(data.data);
    } catch (error) {
      console.error("Failed to fetch status:", error);
    } finally {
      setLoading(false);
    }
  };

  const buySneaker = async () => {
    try {
      const response = await fetch(`${API_URL}/api/sale/buy`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          userId: USER_ID,
          productId: PRODUCT_ID,
        }),
      });

      const data = await response.json();

      console.log("Buy response:", data);

      await fetchStatus();
    } catch (error) {
      console.error("Buy failed:", error);
    }
  };

  const payNow = async () => {
    try {
      const eventId = `payment-event-${Date.now()}`;

      const paymentId = `fake-payment-${Date.now()}`;

      const response = await fetch(`${API_URL}/api/payment/event`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          eventId,
          paymentId,
          orderId: status.hold.orderId,
          eventType: "payment.success",
          payload: {
            amount: 999,
            currency: "INR",
          },
        }),
      });

      const data = await response.json();

      console.log("Payment response:", data);

      await fetchStatus();
    } catch (error) {
      console.error("Payment failed:", error);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  useEffect(() => {
    if (!status?.hold?.expires_at) {
      setTimeLeft(0);

      return;
    }

    const calculateTimeLeft = () => {
      const expiryTime = new Date(status.hold.expires_at).getTime();

      const currentTime = Date.now();

      const difference = expiryTime - currentTime;

      setTimeLeft(Math.max(0, Math.floor(difference / 1000)));
    };

    calculateTimeLeft();

    const interval = setInterval(calculateTimeLeft, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [status]);

  if (loading) {
    return (
      <div className="app">
        <h1>SneakDrop</h1>

        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <h1>SneakDrop</h1>

      <p>Limited Edition Sneaker</p>

      <h2>Pairs Left: {status?.availableStock}</h2>

      <button
        onClick={buySneaker}
        disabled={!!status?.hold || status?.paidOrders >= 2}
      >
        {status?.paidOrders >= 2
          ? "Purchase Limit Reached"
          : status?.hold
            ? "Hold Active"
            : "Buy Now"}
      </button>

      {status?.hold?.orderId && <button onClick={payNow}>Pay Now</button>}

      <div>
        <h3>Your Hold</h3>

        {status?.hold ? (
          <div>
            <p>Hold active</p>

            <h2>
              {Math.floor(timeLeft / 60)
                .toString()
                .padStart(2, "0")}
              :{(timeLeft % 60).toString().padStart(2, "0")}
            </h2>
          </div>
        ) : (
          <p>No active hold</p>
        )}
      </div>

      <div>
        <h3>Waitlist</h3>

        {status?.waitlist ? (
          <p>Position: {status.waitlist.position}</p>
        ) : (
          <p>Not in waitlist</p>
        )}
      </div>

      <div>
        <h3>Paid Orders</h3>

        <p>{status?.paidOrders}</p>
      </div>
    </div>
  );
}

export default App;
