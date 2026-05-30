import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import request from "../api/client";

function SuccessPage() {
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState(null);

  useEffect(() => {
    const verifyOrder = async () => {
      try {
        const sessionId = searchParams.get("session_id");

        if (!sessionId) {
          throw new Error("Missing session id");
        }

        const result = await request(
          `/checkout/verify/${sessionId}`
        );

        setOrderId(result.orderId);
      } catch (err) {
        console.error(err);
        setError("Unable to verify payment.");
      } finally {
        setLoading(false);
      }
    };

    verifyOrder();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="success-page">
        <h2>Verifying Payment...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="success-page">
        <h2>Verification Failed</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="success-page">
      <h1>Payment Successful</h1>

      <p>
        Thank you for your purchase.
      </p>

      <p>
        Order ID#{orderId} has been confirmed.
      </p>
    </div>
  );
}

export default SuccessPage;