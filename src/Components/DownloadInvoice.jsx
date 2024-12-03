import { auth, db } from "../config/firebase";
import Swal from "sweetalert2";
import { doc, getDoc } from "firebase/firestore";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

const DownloadInvoice = async (invoiceNumber) => {
  try {
    // Fetch the specific invoice from Firestore
    const invoiceRef = doc(
      db,
      "admins",
      auth.currentUser.email, // Ensure that the user is authenticated
      "Invoices",
      invoiceNumber.toString()
    );
    const invoiceSnap = await getDoc(invoiceRef);

    if (invoiceSnap.exists()) {
      const invoiceData = invoiceSnap.data();

      // Create a new jsPDF instance
      const pdf = new jsPDF();

      // Get the page width and height
      const pageWidth = pdf.internal.pageSize.width;
      const pageHeight = pdf.internal.pageSize.height;

      // Draw a border around the page (x, y, width, height)
      pdf.setDrawColor(0, 0, 0); // Set border color (black)
      pdf.setLineWidth(0.5); // Set border thickness
      pdf.rect(10, 10, pageWidth - 20, pageHeight - 20); // Create border with some padding from edges

      // Add Invoice Title (Centered)
      pdf.setFontSize(18);
      pdf.text("Invoice", pageWidth / 2, 20, { align: "center" });

      // Add Invoice Number and Date
      let yPosition = 30; // Start below the title
      pdf.setFontSize(9);
      pdf.text(`Invoice: ${invoiceData.invoiceNumber}`, 20, yPosition);
      yPosition += 10;
      pdf.text(`Date: ${invoiceData.invoiceDate}`, 20, yPosition);
      yPosition += 10;

      // Add Bill From Section - Left side
      pdf.setFontSize(12);
      pdf.text("Bill From", 20, yPosition); // Left-aligned header
      yPosition += 10;

      pdf.setFontSize(10);
      const businessName = invoiceData.billFrom?.businessName || "N/A";
      pdf.text(`Company: ${businessName}`, 20, yPosition);
      yPosition += 10;

      const registrationNumber = invoiceData.billFrom?.registrationNumber || "N/A";
      pdf.text(`Registration Number: ${registrationNumber}`, 20, yPosition);
      yPosition += 10;

      const address = invoiceData.billFrom?.address || "N/A";
      pdf.text(`Address: ${address}`, 20, yPosition);
      yPosition += 10;

      const contactNumber = invoiceData.billFrom?.contactNumber || "N/A";
      pdf.text(`Contact: ${contactNumber}`, 20, yPosition);
      yPosition += 10;

      const email = invoiceData.billFrom?.email || "N/A";
      pdf.text(`Email: ${email}`, 20, yPosition);
      yPosition += 10;

      const gstNumber = invoiceData.billFrom?.gstNumber || "N/A";
      pdf.text(`GST Number: ${gstNumber}`, 20, yPosition);
      yPosition += 10;

      const aadhaar = invoiceData.billFrom?.aadhaar || "N/A";
      pdf.text(`Aadhar: ${aadhaar}`, 20, yPosition);
      yPosition += 10;

      const panno = invoiceData.billFrom?.panno || "N/A";
      pdf.text(`PAN Number: ${panno}`, 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(12);
      // Bill To Section - Right side, aligned to top
      pdf.text("Bill To", pageWidth - 80, 30); // Right-aligned header for Bill To
      let billToYPosition = 40; // Start the "Bill To" details below the header

      const rightXPosition = pageWidth - 80; // Fixed X position for right-aligned text
      const billTo = invoiceData.billTo || {}; // Ensure billTo exists before accessing its properties
      pdf.setFontSize(10);
      // Set the Bill To data
      pdf.text(`Name: ${billTo.name || "N/A"}`, rightXPosition, billToYPosition);
      billToYPosition += 10;  // Increment Y position after each data field
      pdf.text(`Email: ${billTo.email || "N/A"}`, rightXPosition, billToYPosition);
      billToYPosition += 10;
      pdf.text(`Phone: ${billTo.phone || "N/A"}`, rightXPosition, billToYPosition);
      billToYPosition += 10;
      pdf.text(`Address: ${billTo.Address || "N/A"}`, rightXPosition, billToYPosition);
      billToYPosition += 10;
      pdf.text(`City: ${billTo.City || "N/A"}`, rightXPosition, billToYPosition);
      billToYPosition += 10;
      pdf.text(`State: ${billTo.state || "N/A"}`, rightXPosition, billToYPosition);
      billToYPosition += 10;
      pdf.text(`ZipCode: ${billTo.zipCode || "N/A"}`, rightXPosition, billToYPosition);
      billToYPosition += 10;
      pdf.text(`Aadhaar: ${billTo.aadhaar || "N/A"}`, rightXPosition, billToYPosition);
      billToYPosition += 10;
      pdf.text(`GstNumber: ${billTo.gstNumber || "N/A"}`, rightXPosition, billToYPosition);
      billToYPosition += 10;
      pdf.text(`Panno: ${billTo.panno || "N/A"}`, rightXPosition, billToYPosition);
      billToYPosition += 10;
      pdf.text(`Website: ${billTo.website || "N/A"}`, rightXPosition, billToYPosition);
      billToYPosition += 10;


      // Add Products Table
      const tableColumn = ["Product", "Quantity", "Price", "Total"];
      const tableRows = [];
      (invoiceData.products || []).forEach((product) => {
        const productData = [
          product.name,
          product.quantity,
          `₹${product.price}`,
          `₹${product.total}`,
        ];
        tableRows.push(productData);
      });
      yPosition += 10; // Add some space before the table
      pdf.autoTable(tableColumn, tableRows, {
        startY: yPosition,
        margin: { top: 20 },
        bodyStyles: { valign: 'top' },
      });

      // Add Total Amount
      const totalAmount = (invoiceData.products || []).reduce(
        (acc, product) => acc + (product.total || 0),
        0
      );
      yPosition = pdf.lastAutoTable.finalY + 10;
    yPosition += 10;
      // Add Payment and Shipping Details
      pdf.setFontSize(10);
      pdf.text(`Payment Status: ${invoiceData.paymentStatus}`, 20, yPosition);
      yPosition += 10;
      pdf.text(`Shipping Method: ${invoiceData.shippingMethod}`, 20, yPosition);
      yPosition += 10;
      pdf.text(`Payment Method: ${invoiceData.paymentMethod}`, 20, yPosition);
      yPosition += 10;


// Add Tax Details (Right Aligned)

pdf.text(`CGST: ₹${invoiceData.taxDetails?.CGST || 0}`, 140, 180);
pdf.text(`SGST: ₹${invoiceData.taxDetails?.SGST || 0}`, 140, 180 + 10); // Add 10px space between each line
pdf.text(`IGST: ₹${invoiceData.taxDetails?.IGST || 0}`, 140, 180 + 20); // Add space for the third line
// Add Total Amount (Right Aligned)

const totalAmountXPosition = pageWidth - 90; // Position it towards the right side
pdf.text(`Total Amount: ₹${totalAmount.toFixed(2)}`, totalAmountXPosition, yPosition);
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
