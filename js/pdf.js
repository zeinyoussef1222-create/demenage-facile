// ============================================================
// Bougeotte — PDF Generation Module
// Uses jsPDF (loaded via CDN in index.html)
// ============================================================

/**
 * Generate a single PDF letter
 */
export function genererPDF(courrier, organisme, userData) {
    // eslint-disable-next-line no-undef
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    // — Page setup —
    const marginLeft = 25;
    const marginRight = 25;
    const pageWidth = 210;
    const usableWidth = pageWidth - marginLeft - marginRight;
    let y = 25;

    // — Accent bar at top —
    const gradient = doc.setFillColor(99, 102, 241);
    doc.rect(0, 0, 210, 4, 'F');

    // — Sender Info (top-left) —
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const senderLines = `${userData.prenom} ${userData.nom}\n${userData.ancienneAdresse}`.split('\n');
    senderLines.forEach(line => {
        doc.text(line, marginLeft, y);
        y += 5;
    });

    // — Recipient Info (right-aligned) —
    y += 5;
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    const recipientText = organisme.adresse || organisme.nom;
    const recipientLines = recipientText.split('\n');
    recipientLines.forEach(line => {
        doc.text(line, pageWidth - marginRight, y, { align: 'right' });
        y += 5;
    });

    // — Date —
    y += 10;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const dateStr = `${userData.ville}, le ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`;
    doc.text(dateStr, pageWidth - marginRight, y, { align: 'right' });

    // — Subject —
    y += 15;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(99, 102, 241);
    doc.text(`Objet : Changement d'adresse`, marginLeft, y);

    // — Separator —
    y += 5;
    doc.setDrawColor(200, 200, 200);
    doc.line(marginLeft, y, pageWidth - marginRight, y);

    // — Body —
    y += 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);

    // Split body into paragraphs and wrap text
    const bodyLines = courrier.split('\n');
    // Find the start of the body (after the header which we've already rendered)
    let bodyStartIndex = 0;
    for (let i = 0; i < bodyLines.length; i++) {
        if (bodyLines[i].startsWith('Madame, Monsieur')) {
            bodyStartIndex = i;
            break;
        }
    }

    for (let i = bodyStartIndex; i < bodyLines.length; i++) {
        const line = bodyLines[i];
        if (line.trim() === '') {
            y += 4;
            continue;
        }

        const wrappedLines = doc.splitTextToSize(line, usableWidth);
        wrappedLines.forEach(wl => {
            if (y > 270) {
                doc.addPage();
                y = 25;
                // Re-add accent bar
                doc.setFillColor(99, 102, 241);
                doc.rect(0, 0, 210, 4, 'F');
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(10);
                doc.setTextColor(40, 40, 40);
            }
            doc.text(wl, marginLeft, y);
            y += 5;
        });
    }

    // — Footer —
    const footerY = 285;
    doc.setFontSize(7);
    doc.setTextColor(180, 180, 180);
    doc.text('Document généré par Bougeotte — Bougeotte.fr', pageWidth / 2, footerY, { align: 'center' });

    // — Bottom accent bar —
    doc.setFillColor(99, 102, 241);
    doc.rect(0, 293, 210, 4, 'F');

    return doc;
}

/**
 * Download a single PDF
 */
export function telechargerPDF(courrier, organisme, userData) {
    const doc = genererPDF(courrier, organisme, userData);
    const filename = `changement_adresse_${organisme.id}.pdf`;
    doc.save(filename);
}

/**
 * Generate and download all PDFs as individual files
 */
export function telechargerTousPDF(documents, userData) {
    documents.forEach(docData => {
        if (docData.type === 'courrier' || docData.organisme.adresse) {
            telechargerPDF(docData.courrier, docData.organisme, userData);
        }
    });
}

/**
 * Generate a combined PDF with all letters
 */
export function telechargerPDFCombine(documents, userData) {
    // eslint-disable-next-line no-undef
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    let firstPage = true;

    documents.forEach(docData => {
        if (!firstPage) {
            doc.addPage();
        }
        firstPage = false;

        const marginLeft = 25;
        const marginRight = 25;
        const pageWidth = 210;
        const usableWidth = pageWidth - marginLeft - marginRight;
        let y = 25;

        // Accent bar
        doc.setFillColor(99, 102, 241);
        doc.rect(0, 0, 210, 4, 'F');

        // Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(99, 102, 241);
        doc.text(`📄 ${docData.organisme.nom}`, marginLeft, y);
        y += 8;

        // Separator
        doc.setDrawColor(200, 200, 200);
        doc.line(marginLeft, y, pageWidth - marginRight, y);
        y += 8;

        // Body
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(40, 40, 40);

        const lines = docData.courrier.split('\n');
        lines.forEach(line => {
            if (line.trim() === '') {
                y += 3;
                return;
            }
            const wrappedLines = doc.splitTextToSize(line, usableWidth);
            wrappedLines.forEach(wl => {
                if (y > 275) {
                    doc.addPage();
                    y = 25;
                    doc.setFillColor(99, 102, 241);
                    doc.rect(0, 0, 210, 4, 'F');
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(9);
                    doc.setTextColor(40, 40, 40);
                }
                doc.text(wl, marginLeft, y);
                y += 4.5;
            });
        });

        // Footer
        doc.setFontSize(7);
        doc.setTextColor(180, 180, 180);
        doc.text('Bougeotte — Bougeotte.fr', pageWidth / 2, 285, { align: 'center' });
        doc.setFillColor(99, 102, 241);
        doc.rect(0, 293, 210, 4, 'F');
    });

    doc.save('Bougeotte_tous_courriers.pdf');
}
