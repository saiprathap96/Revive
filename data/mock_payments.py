import random
import sqlite3
from datetime import datetime, timedelta

def generate_mock_data(n=200):
    conn = sqlite3.connect("revenue.db")
    c = conn.cursor()
    c.execute("""CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY, customer TEXT, email TEXT,
        amount REAL, currency TEXT, status TEXT,
        failure_reason TEXT, due_date TEXT, attempts INTEGER)""")

    customers = [("Acme Corp", "finance@acme.com"), ("Globex", "ap@globex.io"),
                 ("Initech", "billing@initech.com"), ("Umbrella", "pay@umbrella.co"),
                 ("Stark Industries", "accounts@stark.com")]
    reasons = ["card_expired", "insufficient_funds", "payment_retry_failed", None]

    for i in range(n):
        cust, email = random.choice(customers)
        amount = round(random.uniform(99, 4999), 2)
        status = random.choices(["paid", "failed", "at_risk"], weights=[70, 18, 12])[0]
        reason = random.choice(reasons) if status != "paid" else None
        due = (datetime.now() - timedelta(days=random.randint(1, 45))).isoformat()
        c.execute("INSERT OR REPLACE INTO invoices VALUES (?,?,?,?,?,?,?,?,?)",
                  (f"inv_{i:04d}", cust, email, amount, "USD", status,
                   reason, due, random.randint(1, 4) if status != "paid" else 1))
    conn.commit()
    conn.close()
    print(f"✅ Created {n} mock invoices in revenue.db")

generate_mock_data()
