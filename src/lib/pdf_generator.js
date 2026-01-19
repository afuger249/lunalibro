import { jsPDF } from "jspdf";

/**
 * Helper to convert an image URL or blob to Base64.
 * Required because jsPDF addImage handles URLs poorly in some environments.
 */
const imageUrlToBase64 = async (url) => {
    if (!url) return null;
    if (url.startsWith('data:')) return url; // Already base64

    try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.warn("Failed to convert image to base64:", url, e);
        return null;
    }
};

/**
 * Generates a PDF from the story object.
 * @param {Object} story - The story object containing title, pages, etc.
 */
export const generateStoryPDF = async (story) => {
    console.log("Generating PDF for story:", story.title);
    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4" // 210mm x 297mm
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxTextWidth = pageWidth - (margin * 2);

    const storyTitle = story.title || "Magic Story";

    try {
        // --- COVER PAGE ---
        doc.setFillColor(240, 248, 255); // AliceBlue
        doc.rect(0, 0, pageWidth, pageHeight, "F");

        // Title
        doc.setFont("helvetica", "bold");
        doc.setFontSize(28);
        doc.setTextColor(51, 65, 85); // Slate 700

        const splitTitle = doc.splitTextToSize(storyTitle, maxTextWidth);
        let titleY = 40;
        doc.text(splitTitle, pageWidth / 2, titleY, { align: "center" });

        // Cover Image (Page 1)
        if (story.pages && story.pages[0]?.image) {
            try {
                const imgData = await imageUrlToBase64(story.pages[0].image);
                if (imgData) {
                    const imgWidth = 140;
                    const imgHeight = 140;
                    const imgX = (pageWidth - imgWidth) / 2;
                    const imgY = titleY + (splitTitle.length * 12) + 15;
                    // Use JPEG for consistency and size
                    doc.addImage(imgData, "JPEG", imgX, imgY, imgWidth, imgHeight, 'cover', 'FAST');
                }
            } catch (coverErr) {
                console.warn("Failed to add cover image to PDF:", coverErr);
            }
        }

        // Credits / Footer
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text("Created with LumiLibro", pageWidth / 2, pageHeight - 30, { align: "center" });

        // Date
        doc.setFontSize(10);
        doc.text(`Created on ${new Date(story.created_at || Date.now()).toLocaleDateString()}`, pageWidth / 2, pageHeight - 20, { align: "center" });

        // --- STORY PAGES ---
        if (story.pages) {
            for (let index = 0; index < story.pages.length; index++) {
                if (index === 0) continue; // Skip cover (already used)

                const page = story.pages[index];
                doc.addPage();
                doc.setFillColor(255, 255, 255);
                doc.rect(0, 0, pageWidth, pageHeight, "F");

                // Page Number
                doc.setFontSize(10);
                doc.setTextColor(150);
                doc.text(`Page ${index}`, pageWidth - 20, pageHeight - 10, { align: "right" });

                // Image (Top Half)
                if (page.image) {
                    try {
                        const imgData = await imageUrlToBase64(page.image);
                        if (imgData) {
                            const imgWidth = 150;
                            const imgHeight = 150;
                            const imgX = (pageWidth - imgWidth) / 2;
                            const imgY = 30;
                            // Use JPEG to keep PDF size small and portable
                            doc.addImage(imgData, "JPEG", imgX, imgY, imgWidth, imgHeight, `page_${index}`, 'FAST');
                        }
                    } catch (imgError) {
                        console.warn(`Failed to add image for page ${index}:`, imgError);
                        // Continue without image rather than failing the whole PDF
                    }
                }

                // Text (Bottom Half)
                doc.setFont("helvetica", "normal");
                doc.setFontSize(16);
                doc.setTextColor(0);

                const textY = 190;
                // Support both old structure (text) and new bilingual structure
                const mainText = page.spanishText || page.text || "";
                const splitText = doc.splitTextToSize(mainText, maxTextWidth);
                doc.text(splitText, pageWidth / 2, textY, { align: "center", lineHeightFactor: 1.5 });

                // Add English translation if it exists (Bilingual support)
                if (page.englishText) {
                    doc.setFont("helvetica", "italic");
                    doc.setFontSize(14);
                    doc.setTextColor(80, 80, 80); // Dark grey
                    const englishY = textY + (splitText.length * 8) + 10;
                    const splitEnglish = doc.splitTextToSize(page.englishText, maxTextWidth);
                    doc.text(splitEnglish, pageWidth / 2, englishY, { align: "center", lineHeightFactor: 1.3 });
                }
            }
        }

        // --- PREPARE ---
        const safeTitle = (storyTitle || 'story').replace(/[^a-z0-9]/gi, '').toLowerCase().substring(0, 20);
        const fileName = `${safeTitle || 'story'}.pdf`;

        // Metadata
        doc.setProperties({ title: storyTitle, author: "LumiLibro" });

        const pdfData = doc.output('arraybuffer');
        // V15: Using octet-stream to trick webviews into respecting the 'download' attribute
        const blob = new Blob([pdfData], { type: 'application/octet-stream' });
        const blobUrl = URL.createObjectURL(blob);

        console.log(`[v15] Final Prep! Size: ${(blob.size / 1024 / 1024).toFixed(2)} MB`);

        // Return a "Trusted" trigger function
        const trigger = () => {
            console.log("[v15] Executing Trusted Trigger for:", fileName);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = fileName;
            a.target = '_blank'; // Some webviews require this
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                // We keep the URL alive for a bit in case of retries
            }, 2000);
        };

        return { blob, blobUrl, fileName, trigger };

    } catch (err) {
        console.error("[v15] Critical PDF Failure:", err);
        throw err;
    }
};
