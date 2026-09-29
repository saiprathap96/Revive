import unittest
from unittest.mock import patch

from agent.recovery_agent import score_invoice


class RecoveryAgentFallbackTests(unittest.TestCase):
    def test_score_invoice_uses_fallback_when_api_fails(self):
        invoice = {
            "id": "inv_001",
            "customer": "Acme Corp",
            "amount": 1250.00,
            "currency": "USD",
            "failure_reason": "card_expired",
            "status": "failed",
        }

        with patch(
            "agent.recovery_agent.client.chat.completions.create",
            side_effect=TimeoutError("simulated timeout"),
        ):
            result = score_invoice(invoice)

        self.assertIn("recovery_score", result)
        self.assertIsInstance(result["recovery_score"], int)
        self.assertGreaterEqual(result["recovery_score"], 0)
        self.assertLessEqual(result["recovery_score"], 100)
        self.assertIn("reasoning", result)


if __name__ == "__main__":
    unittest.main()
