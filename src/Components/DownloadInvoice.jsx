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

      // Create a new jsPDF instance with A4 size
      const pdf = new jsPDF("p", "mm", "a4");

      // Get the page width and height for A4 size
      const pageWidth = pdf.internal.pageSize.width; // 210mm
      const pageHeight = pdf.internal.pageSize.height; // 297mm

      // Define Tailwind-inspired colors
      const headerColor = "#2c2d7d"; // Blue 800
      const sectionHeaderColor = "#0EA5E9"; // Sky 500
      const footerColor = "#2c2d7d"; // Gray 900
      const bodyColor = "#2c2d7d"; // Blue 800 // Blue 800 // Gray 200
      const tableHeaderColor = "#1E3A8A"; // Indigo 800
      const tableRowColor = "#E5E7EB"; // Gray 300 for table rows
      const textColor = "#ffffff"; // Gray 900 for text
      const tableTextColor = "#1F2937"; // Dark gray for table text
      const highlightColor = "#F59E0B"; // Amber 500 for important text
      const borderColor = "#E5E7EB"; // Light gray for borders

      // Set the font for the invoice
      pdf.setFont("helvetica");

      // Background color for the entire page
      pdf.setFillColor(bodyColor);
      pdf.rect(0, 0, pageWidth, pageHeight, "F");

      // Full-page background color
      pdf.setFillColor(bodyColor);
      pdf.rect(0, 0, pageWidth, pageHeight, "F");

      // Header Section with vibrant background
      pdf.setFillColor(headerColor);
      pdf.rect(10, 10, pageWidth - 20, 30, "F"); // Header background with bold color
      pdf.setTextColor(255, 255, 255); // White text for the header
      pdf.setFontSize(24);
      pdf.text("INVOICE", pageWidth / 2, 25, { align: "center" });

      // Reuse yPosition declared earlier in the code for Invoice Number and Date
      const sectionWidth = (pageWidth - 40) / 2; // Equal width for both sections
      let yPosition = 50;

      // Invoice Number Section
      pdf.setFontSize(12);
      pdf.setTextColor(textColor); // Set text color to dark gray
      pdf.text(`Invoice #: ${invoiceData.invoiceNumber}`, 25, yPosition + 10);

      // Date Section
      pdf.setFontSize(12);
      pdf.setTextColor(textColor); // Set text color to dark gray
      pdf.text(
        `Date: ${invoiceData.invoiceDate}`,
        25 + sectionWidth + 20,
        yPosition + 10
      );

      // Add some space before the "Bill From" and "Bill To" sections
      yPosition += 25; // Adjust spacing for less space

      // "Bill From" and "Bill To" sections (without boxes, but clearly separated)
      const sectionWidthForBill = (pageWidth - 40) / 2; // Equal width for both sections
      const sectionYPosition = yPosition; // Starting Y position for the sections

      // "Bill From" Section
      const billFrom = invoiceData.billFrom || {};
      pdf.setFontSize(14);
      pdf.setTextColor(sectionHeaderColor); // Set font color to sky for "Bill From"
      pdf.text("Bill From", 25, sectionYPosition + 10);
      let billFromYPosition = sectionYPosition + 14;
      pdf.setFontSize(12);
      pdf.setTextColor(textColor); // Set font color back to gray for text
      pdf.text(
        `Company: ${billFrom.businessName || "N/A"}`,
        25,
        billFromYPosition
      );
      billFromYPosition += 6; // Reduce space between lines
      pdf.text(`Address: ${billFrom.address || "N/A"}`, 25, billFromYPosition);
      billFromYPosition += 6;
      pdf.text(
        `Contact: ${billFrom.contactNumber || "N/A"}`,
        25,
        billFromYPosition
      );
      billFromYPosition += 6;
      pdf.text(`Email: ${billFrom.email || "N/A"}`, 25, billFromYPosition);

      // "Bill To" Section
      const billTo = invoiceData.billTo || {};
      pdf.setFontSize(14);
      pdf.setTextColor(sectionHeaderColor); // Set font color to sky for "Bill To"
      pdf.text("Bill To", 25 + sectionWidthForBill + 20, sectionYPosition + 10);
      let billToYPosition = sectionYPosition + 14;
      pdf.setFontSize(12);
      pdf.setTextColor(textColor); // Set font color back to gray for text
      pdf.text(
        `Name: ${billTo.name || "N/A"}`,
        25 + sectionWidthForBill + 20,
        billToYPosition
      );
      billToYPosition += 6; // Reduce space between lines
      pdf.text(
        `Email: ${billTo.email || "N/A"}`,
        25 + sectionWidthForBill + 20,
        billToYPosition
      );
      billToYPosition += 6;
      pdf.text(
        `Phone: ${billTo.phone || "N/A"}`,
        25 + sectionWidthForBill + 20,
        billToYPosition
      );
      billToYPosition += 6;
      pdf.text(
        `Address: ${billTo.address || "N/A"}`,
        25 + sectionWidthForBill + 20,
        billToYPosition
      );

      // Add some space before the products table
      yPosition = Math.max(billFromYPosition, billToYPosition) + 10;

      // Products Table with Enhanced Design
      const tableColumns = ["Product", "Quantity", "Price", "Total"];
      const tableRows = [];
      (invoiceData.products || []).forEach((product) => {
        const row = [
          product.pname,
          product.quantity,
          `₹${product.price}`,
          `₹${product.total}`,
        ];
        tableRows.push(row);
      });

      pdf.autoTable({
        startY: yPosition,
        head: [tableColumns],
        body: tableRows,
        margin: { left: 15, right: 15 },
        headStyles: {
          fillColor: tableHeaderColor,
          textColor: [255, 255, 255],
          fontStyle: "bold",
          lineWidth: 0.5,
          lineColor: "#E5E7EB", // Table border lines
        },
        bodyStyles: {
          fillColor: tableRowColor,
          textColor: tableTextColor,
          valign: "middle",
          lineWidth: 0.5,
          lineColor: "#E5E7EB", // Table border lines
        },
        alternateRowStyles: {
          fillColor: "#FFFFFF", // Alternating rows with white color
        },
        styles: { fontSize: 10, halign: "center" },
        theme: "grid", // Full grid theme with borders
      });

      // Add Grand Total and GST details aligned to the right below the table
      const totalAmount = (invoiceData.products || []).reduce(
        (acc, product) => acc + (product.total || 0),
        0
      );

      const totalBoxYPosition = pdf.lastAutoTable.finalY + 10;

      // Set text color and font for the totals
      pdf.setTextColor(highlightColor); // Amber color for grand total
      pdf.setFontSize(14);
      pdf.text(
        `Grand Total: ₹${totalAmount.toFixed(2)}`,
        pageWidth - 90,
        totalBoxYPosition,
        { align: "left" }
      );

      // Add GST Details (CGST, SGST, IGST)
      const paymentDetailsYPosition = totalBoxYPosition + 8;
      pdf.setTextColor(textColor); // Dark gray text
      pdf.setFontSize(12);
      pdf.text(
        `CGST: ₹${invoiceData.taxDetails?.CGST || 0}`,
        pageWidth - 90,
        paymentDetailsYPosition,
        { align: "left" }
      );
      pdf.text(
        `SGST: ₹${invoiceData.taxDetails?.SGST || 0}`,
        pageWidth - 90,
        paymentDetailsYPosition + 6,
        { align: "left" }
      );
      pdf.text(
        `IGST: ₹${invoiceData.taxDetails?.IGST || 0}`,
        pageWidth - 90,
        paymentDetailsYPosition + 12,
        { align: "left" }
      );

      // Footer Section
      pdf.setFillColor(footerColor);
      pdf.rect(15, pageHeight - 40, pageWidth - 30, 30, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(12);
      pdf.text("Thank you for your business!", pageWidth / 2, pageHeight - 25, {
        align: "center",
      });
      pdf.text(
        "For more information, visit www.companywebsite.com",
        pageWidth / 2,
        pageHeight - 15,
        { align: "center" }
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
