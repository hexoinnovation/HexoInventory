import { doc, getDoc } from "firebase/firestore";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { db } from "../config/firebase";

const DownloadInvoice = async (invoiceNumber) => {
  try {
    // Fetch the specific invoice from Firestore
    const invoiceRef = doc(
      db,
      "admins",
      auth.currentUser.email,
      "Invoices",
      invoiceNumber.toString()
    );
    const invoiceSnap = await getDoc(invoiceRef);

    if (invoiceSnap.exists()) {
      const invoiceData = invoiceSnap.data();

      // Create a new jsPDF instance
      const pdf = new jsPDF();

      // Add Invoice Title
      pdf.setFontSize(16);
      pdf.text(`Invoice: ${invoiceData.invoiceNumber}`, 20, 20);

      // Add Invoice Details
      pdf.setFontSize(12);
      pdf.text(`Client: ${invoiceData.billTo?.name || "N/A"}`, 20, 30);
      pdf.text(`Email: ${invoiceData.billTo?.email || "N/A"}`, 20, 40);
      pdf.text(
        `Date: ${new Date(invoiceData.invoiceDate).toLocaleDateString()}`,
        20,
        50
      );
      pdf.text(`Status: ${invoiceData.paymentStatus}`, 20, 60);

      // Add Table Header
      const tableColumn = ["Product", "Quantity", "Price", "Total"];
      const tableRows = [];

      // Add Products Data to Table Rows
      (invoiceData.products || []).forEach((product) => {
        const productData = [
          product.name,
          product.quantity,
          `₹${product.price}`,
          `₹${product.total}`,
        ];
        tableRows.push(productData);
      });

      // Add Table to PDF
      pdf.autoTable(tableColumn, tableRows, { startY: 70 });

      // Add Total Amount
      const totalAmount = (invoiceData.products || []).reduce(
        (acc, product) => acc + (product.total || 0),
        0
      );
      pdf.setFontSize(14);
      pdf.text(
        `Total Amount: ₹${totalAmount.toFixed(2)}`,
        20,
        pdf.lastAutoTable.finalY + 10
      );

      // Save the PDF
      pdf.save(`Invoice_${invoiceData.invoiceNumber}.pdf`);
    } else {
      throw new Error("Invoice does not exist.");
    }
  } catch (error) {
    console.error("Error generating PDF:", error);
    Swal.fire("Error!", "Failed to generate the invoice PDF.", "error");
  }
};

export default DownloadInvoice;
