import { doc, updateDoc } from "firebase/firestore";
import db from "@/lib/firebase";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { ticket } = req.body;
    
    if (!ticket || !ticket.id) {
      return res.status(400).json({ message: "Ticket docId is required." });
    }

    const ticketRef = doc(db, "CUSTOMERTICKETS", ticket.id);

    await updateDoc(ticketRef, {
      status: "closed",
    });

    return res.status(200).json({ message: "Ticket closed successfully." });
  } catch (error) {
    console.error("Error closing ticket:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
