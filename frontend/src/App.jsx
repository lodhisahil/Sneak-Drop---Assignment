import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:5000";

const PRODUCT_ID = "fe539a42-ae92-4647-bbc1-691bb1bf53b7";

const DEMO_USERS = [
  {
    id: "demo-user-1",
    name: "User 1",
  },
  {
    id: "demo-user-2",
    name: "User 2",
  },
  {
    id: "demo-user-3",
    name: "User 3",
  },
  {
    id: "demo-user-4",
    name: "User 4",
  },
  {
    id: "demo-user-5",
    name: "User 5",
  },
  {
    id: "demo-user-6",
    name: "User 6",
  },
];

function App() {
  const [selectedUser, setSelectedUser] = useState(DEMO_USERS[0]);

  const [status, setStatus] = useState(null);

  const [loading, setLoading] = useState(true);

  const [timeLeft, setTimeLeft] = useState(0);

  const fetchStatus = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/api/sale/status?userId=${selectedUser.id}&productId=${PRODUCT_ID}`,
      );

      const data = await response.json();

      console.log("Status response:", data);

      setStatus(data.data);
    } catch (error) {
      console.error("Failed to fetch status:", error);

      setStatus(null);
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
          userId: selectedUser.id,
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
      const eventId = `payment-event-${selectedUser.id}-${Date.now()}`;

      const paymentId = `fake-payment-${selectedUser.id}-${Date.now()}`;

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
  }, [selectedUser]);

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
      <div>
        <label>Select User: </label>
        <select
          value={selectedUser.id}
          onChange={(event) => {
            const user = DEMO_USERS.find(
              (user) => user.id === event.target.value,
            );
            setSelectedUser(user);
          }}
        >
          {DEMO_USERS.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
      </div>
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
