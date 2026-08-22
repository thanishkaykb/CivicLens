/**
 * Document generation utilities for CivicLens RTI applications.
 * Supports Text, Word (.docx), and PDF export.
 */

import type { RTIDraft, AuthorityInfo, EvidenceItem } from "./rti-types";

// ─── TEXT EXPORT ──────────────────────────────────────────────────────────────

export function generateText(draft: RTIDraft, authority: AuthorityInfo | null): string {
  const lines: string[] = [];

  lines.push(draft.title.toUpperCase());
  lines.push("=".repeat(draft.title.length + 4));
  lines.push("");
  lines.push(`Date: ${draft.date}`);
  lines.push("");
  lines.push("─".repeat(60));
  lines.push("");

  if (authority) {
    lines.push("TO,");
    lines.push("");
    lines.push(authority.addressedTo || "The Public Information Officer");
    lines.push(authority.publicAuthority);
    if (authority.department) lines.push(`Department: ${authority.department}`);
    if (authority.officialAddress) lines.push(authority.officialAddress);
    lines.push("");
    lines.push("─".repeat(60));
    lines.push("");
  }

  lines.push(`SUBJECT: ${draft.subject}`);
  lines.push("");
  lines.push("─".repeat(60));
  lines.push("");
  lines.push("Respected Sir/Madam,");
  lines.push("");
  lines.push(draft.introduction);
  lines.push("");
  lines.push("I request the following information under the Right to Information Act, 2005:");
  lines.push("");

  draft.informationRequests.forEach((req, i) => {
    lines.push(`${i + 1}. ${req.text}`);
    lines.push("");
  });

  lines.push("─".repeat(60));
  lines.push("");
  lines.push("PREFERRED FORMAT:");
  lines.push(draft.preferredFormat);
  lines.push("");
  lines.push("─".repeat(60));
  lines.push("");
  lines.push("APPLICANT DETAILS:");
  lines.push(`Name: ${draft.applicantName}`);
  lines.push(`Address: ${draft.applicantAddress}`);
  lines.push(`Email: ${draft.applicantEmail}`);
  lines.push(`Phone: ${draft.applicantPhone}`);
  lines.push("");
  lines.push("─".repeat(60));
  lines.push("");
  lines.push(draft.closingStatement);
  lines.push("");
  lines.push("");
  lines.push("Yours faithfully,");
  lines.push("");
  lines.push("");
  lines.push("________________________");
  lines.push(`(${draft.applicantName})`);
  lines.push(`Date: ${draft.date}`);
  lines.push("");

  if (authority) {
    lines.push("");
    lines.push("─".repeat(60));
    lines.push("SOURCE VERIFICATION");
    lines.push(`Source: ${authority.sourceTitle}`);
    lines.push(`URL: ${authority.sourceUrl}`);
    lines.push(`Date Accessed: ${authority.dateAccessed}`);
    lines.push(`Confidence: ${authority.confidenceLevel}`);
    if (!authority.verified) {
      lines.push("NOTE: Authority details could not be fully verified. Please verify before submission.");
    }
  }

  return lines.join("\n");
}

// ─── WORD EXPORT (.docx) ─────────────────────────────────────────────────────

export async function generateWord(draft: RTIDraft, authority: AuthorityInfo | null): Promise<void> {
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    AlignmentType,
    HeadingLevel,
    BorderStyle,
    TabStopType,
    TabStopPosition,
    PageNumber,
    Footer,
    Header,
    SectionType,
    convertInchesToTwip,
  } = await import("docx");

  const sections: any[] = [];
  const children: any[] = [];

  // Title
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: draft.title.toUpperCase(),
          bold: true,
          size: 28,
          font: "Calibri",
        }),
      ],
    })
  );

  // Date
  children.push(
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: `Date: ${draft.date}`,
          size: 22,
          font: "Calibri",
        }),
      ],
    })
  );

  // Separator
  children.push(
    new Paragraph({
      spacing: { after: 200 },
      border: {
        bottom: {
          color: "999999",
          space: 1,
          style: BorderStyle.SINGLE,
          size: 1,
        },
      },
      children: [],
    })
  );

  // Authority details
  if (authority) {
    const authorityLines = [
      "TO,",
      "",
      authority.addressedTo || "The Public Information Officer",
      authority.publicAuthority,
      authority.department ? `Department: ${authority.department}` : null,
      authority.officialAddress,
    ].filter(Boolean);

    for (const line of authorityLines) {
      children.push(
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({
              text: line || "",
              size: 22,
              font: "Calibri",
            }),
          ],
        })
      );
    }

    children.push(
      new Paragraph({
        spacing: { before: 200, after: 200 },
        border: {
          bottom: {
            color: "999999",
            space: 1,
            style: BorderStyle.SINGLE,
            size: 1,
          },
        },
        children: [],
      })
    );
  }

  // Subject
  children.push(
    new Paragraph({
      spacing: { before: 200, after: 200 },
      children: [
        new TextRun({
          text: "SUBJECT: ",
          bold: true,
          size: 22,
          font: "Calibri",
        }),
        new TextRun({
          text: draft.subject,
          size: 22,
          font: "Calibri",
        }),
      ],
    })
  );

  // Separator
  children.push(
    new Paragraph({
      spacing: { after: 200 },
      border: {
        bottom: {
          color: "999999",
          space: 1,
          style: BorderStyle.SINGLE,
          size: 1,
        },
      },
      children: [],
    })
  );

  // Salutation and introduction
  children.push(
    new Paragraph({
      spacing: { before: 200, after: 200 },
      children: [
        new TextRun({
          text: "Respected Sir/Madam,",
          size: 22,
          font: "Calibri",
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: draft.introduction,
          size: 22,
          font: "Calibri",
        }),
      ],
    })
  );

  // Information requests heading
  children.push(
    new Paragraph({
      spacing: { before: 200, after: 100 },
      children: [
        new TextRun({
          text: "I request the following information under the Right to Information Act, 2005:",
          size: 22,
          font: "Calibri",
        }),
      ],
    })
  );

  // Numbered information requests
  draft.informationRequests.forEach((req, i) => {
    children.push(
      new Paragraph({
        spacing: { after: 120 },
        indent: { left: convertInchesToTwip(0.5) },
        children: [
          new TextRun({
            text: `${i + 1}. ${req.text}`,
            size: 22,
            font: "Calibri",
          }),
        ],
      })
    );
  });

  // Preferred format
  children.push(
    new Paragraph({
      spacing: { before: 300, after: 100 },
      border: {
        top: {
          color: "999999",
          space: 1,
          style: BorderStyle.SINGLE,
          size: 1,
        },
      },
      children: [
        new TextRun({
          text: "PREFERRED FORMAT: ",
          bold: true,
          size: 22,
          font: "Calibri",
        }),
        new TextRun({
          text: draft.preferredFormat,
          size: 22,
          font: "Calibri",
        }),
      ],
    })
  );

  // Separator
  children.push(
    new Paragraph({
      spacing: { after: 200 },
      border: {
        bottom: {
          color: "999999",
          space: 1,
          style: BorderStyle.SINGLE,
          size: 1,
        },
      },
      children: [],
    })
  );

  // Applicant details
  children.push(
    new Paragraph({
      spacing: { before: 200, after: 100 },
      children: [
        new TextRun({
          text: "APPLICANT DETAILS:",
          bold: true,
          size: 22,
          font: "Calibri",
        }),
      ],
    })
  );

  const applicantLines = [
    { label: "Name: ", value: draft.applicantName },
    { label: "Address: ", value: draft.applicantAddress },
    { label: "Email: ", value: draft.applicantEmail },
    { label: "Phone: ", value: draft.applicantPhone },
  ];

  for (const line of applicantLines) {
    children.push(
      new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({
            text: line.label,
            bold: true,
            size: 22,
            font: "Calibri",
          }),
          new TextRun({
            text: line.value,
            size: 22,
            font: "Calibri",
          }),
        ],
      })
    );
  }

  // Separator
  children.push(
    new Paragraph({
      spacing: { before: 200, after: 200 },
      border: {
        bottom: {
          color: "999999",
          space: 1,
          style: BorderStyle.SINGLE,
          size: 1,
        },
      },
      children: [],
    })
  );

  // Closing statement
  children.push(
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: draft.closingStatement,
          size: 22,
          font: "Calibri",
        }),
      ],
    })
  );

  // Signature
  children.push(
    new Paragraph({
      spacing: { before: 600, after: 60 },
      children: [
        new TextRun({
          text: "Yours faithfully,",
          size: 22,
          font: "Calibri",
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      spacing: { before: 400, after: 60 },
      children: [
        new TextRun({
          text: "________________________",
          size: 22,
          font: "Calibri",
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: `(${draft.applicantName})`,
          size: 22,
          font: "Calibri",
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: `Date: ${draft.date}`,
          size: 22,
          font: "Calibri",
        }),
      ],
    })
  );

  // Source verification
  if (authority) {
    children.push(
      new Paragraph({
        spacing: { before: 400, after: 100 },
        border: {
          top: {
            color: "999999",
            space: 1,
            style: BorderStyle.SINGLE,
            size: 1,
          },
        },
        children: [
          new TextRun({
            text: "SOURCE VERIFICATION",
            bold: true,
            size: 18,
            font: "Calibri",
            color: "666666",
          }),
        ],
      })
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Source: ${authority.sourceTitle} | URL: ${authority.sourceUrl} | Accessed: ${authority.dateAccessed}`,
            size: 16,
            font: "Calibri",
            color: "666666",
          }),
        ],
      })
    );

    if (!authority.verified) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "NOTE: Authority details could not be fully verified. Please verify before submission.",
              size: 16,
              font: "Calibri",
              color: "CC6600",
              italics: true,
            }),
          ],
        })
      );
    }
  }

  // Create the document
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1.25),
              right: convertInchesToTwip(1.25),
            },
          },
        },
        children,
      },
    ],
  });

  // Generate and download
  const blob = await Packer.toBlob(doc);
  const { saveAs } = await import("file-saver");
  const filename = `RTI_Application_${draft.title.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 40)}.docx`;
  saveAs(blob, filename);
}

// ─── PDF EXPORT ──────────────────────────────────────────────────────────────

export async function generatePDF(draft: RTIDraft, authority: AuthorityInfo | null): Promise<void> {
  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 25;
  const contentWidth = pageWidth - 2 * margin;
  let y = margin;

  const addLine = (text: string, options: { bold?: boolean; size?: number; align?: "left" | "center" | "right"; spacing?: number; color?: [number, number, number] } = {}) => {
    const { bold = false, size = 11, align = "left", spacing = 5, color = [30, 30, 30] } = options;

    if (y > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }

    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(...color);

    const lines = doc.splitTextToSize(text, contentWidth);
    for (const line of lines) {
      if (y > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        y = margin;
      }
      if (align === "center") {
        doc.text(line, pageWidth / 2, y, { align: "center" });
      } else if (align === "right") {
        doc.text(line, pageWidth - margin, y, { align: "right" });
      } else {
        doc.text(line, margin, y);
      }
      y += size * 0.4;
    }
    y += spacing;
  };

  const addSeparator = () => {
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.2);
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;
  };

  // Title
  addLine(draft.title.toUpperCase(), { bold: true, size: 16, align: "center", spacing: 8 });

  // Date
  addLine(`Date: ${draft.date}`, { align: "right", size: 11, spacing: 8 });

  addSeparator();

  // Authority
  if (authority) {
    addLine("TO,", { spacing: 3 });
    addLine(authority.addressedTo || "The Public Information Officer", { spacing: 2 });
    addLine(authority.publicAuthority, { bold: true, spacing: 2 });
    if (authority.department) addLine(`Department: ${authority.department}`, { spacing: 2 });
    if (authority.officialAddress) addLine(authority.officialAddress, { spacing: 5 });
    addSeparator();
  }

  // Subject
  addLine(`SUBJECT: ${draft.subject}`, { bold: true, size: 11, spacing: 8 });

  addSeparator();

  // Salutation
  addLine("Respected Sir/Madam,", { spacing: 5 });

  // Introduction
  addLine(draft.introduction, { spacing: 8 });

  // Requests heading
  addLine("I request the following information under the Right to Information Act, 2005:", { bold: true, spacing: 5 });

  // Numbered requests
  draft.informationRequests.forEach((req, i) => {
    addLine(`${i + 1}. ${req.text}`, { size: 10, spacing: 5 });
  });

  addSeparator();

  // Preferred format
  addLine(`PREFERRED FORMAT: ${draft.preferredFormat}`, { spacing: 8 });

  addSeparator();

  // Applicant details
  addLine("APPLICANT DETAILS:", { bold: true, spacing: 4 });
  addLine(`Name: ${draft.applicantName}`, { spacing: 3 });
  addLine(`Address: ${draft.applicantAddress}`, { spacing: 3 });
  addLine(`Email: ${draft.applicantEmail}`, { spacing: 3 });
  addLine(`Phone: ${draft.applicantPhone}`, { spacing: 5 });

  addSeparator();

  // Closing
  addLine(draft.closingStatement, { spacing: 8 });

  // Signature
  addLine("Yours faithfully,", { spacing: 15 });
  addLine("________________________", { spacing: 5 });
  addLine(`(${draft.applicantName})`, { spacing: 3 });
  addLine(`Date: ${draft.date}`, { spacing: 10 });

  // Source verification
  if (authority) {
    addSeparator();
    addLine("SOURCE VERIFICATION", { bold: true, size: 9, color: [120, 120, 120], spacing: 3 });
    addLine(
      `Source: ${authority.sourceTitle} | URL: ${authority.sourceUrl} | Accessed: ${authority.dateAccessed}`,
      { size: 8, color: [120, 120, 120], spacing: 2 }
    );
    if (!authority.verified) {
      addLine("NOTE: Authority details could not be fully verified. Please verify before submission.", {
        size: 8,
        color: [200, 100, 0],
        spacing: 2,
      });
    }
  }

  // Page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });
  }

  // Save
  const filename = `RTI_Application_${draft.title.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 40)}.pdf`;
  doc.save(filename);
}

// ─── EVIDENCE INDEX ──────────────────────────────────────────────────────────

export function generateEvidenceIndex(evidence: EvidenceItem[]): string {
  if (evidence.length === 0) return "";

  const lines: string[] = [];
  lines.push("SUPPORTING EVIDENCE INDEX");
  lines.push("=".repeat(40));
  lines.push("");

  evidence.forEach((item, i) => {
    lines.push(`${i + 1}. ${item.filename}`);
    lines.push(`   Type: ${item.fileType}`);
    if (item.description) lines.push(`   Description: ${item.description}`);
    if (item.dateProvided) lines.push(`   Date: ${item.dateProvided}`);
    lines.push(`   Included in RTI: ${item.includeInRTI ? "Yes" : "No (user evidence only)"}`);
    lines.push("");
  });

  return lines.join("\n");
}
