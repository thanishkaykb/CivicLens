/**
 * Document generation utilities for CivicLens RTI applications.
 * Professional formatting: 12pt body, 14pt heading, Times New Roman / Calibri.
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
  lines.push("");

  if (authority) {
    lines.push("TO,");
    lines.push("");
    lines.push(authority.addressedTo || "The Public Information Officer");
    lines.push(authority.publicAuthority);
    if (authority.department) lines.push(`Department: ${authority.department}`);
    if (authority.officialAddress) lines.push(authority.officialAddress);
    lines.push("");
    lines.push("");
  }

  lines.push(`SUBJECT: ${draft.subject}`);
  lines.push("");
  lines.push("");
  lines.push("Respected Sir/Madam,");
  lines.push("");
  lines.push(draft.introduction);
  lines.push("");
  lines.push("I request the following information under the Right to Information Act, 2005:");
  lines.push("");

  draft.informationRequests.forEach((req, i) => {
    lines.push(`  ${i + 1}. ${req.text}`);
    lines.push("");
  });

  lines.push("");
  lines.push("PREFERRED FORMAT:");
  lines.push(draft.preferredFormat);
  lines.push("");
  lines.push("");

  lines.push("APPLICANT DETAILS:");
  lines.push(`Name: ${draft.applicantName}`);
  lines.push(`Address: ${draft.applicantAddress}`);
  lines.push(`Email: ${draft.applicantEmail}`);
  lines.push(`Phone: ${draft.applicantPhone}`);
  lines.push("");
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

  if (authority) {
    lines.push("");
    lines.push("");
    lines.push("---");
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
    BorderStyle,
    convertInchesToTwip,
  } = await import("docx");

  const children: any[] = [];

  const FONT = "Times New Roman";
  const BODY = 24;        // 12pt in half-points
  const HEADING = 28;     // 14pt
  const SMALL = 20;       // 10pt
  const LINE_SPACING = 360; // 1.5 line spacing (240 = single)
  const AFTER = 120;

  const addBodyText = (text: string, opts?: { bold?: boolean; size?: number; align?: typeof AlignmentType[keyof typeof AlignmentType]; spacingBefore?: number; spacingAfter?: number; indent?: number }) => {
    const { bold = false, size = BODY, align = AlignmentType.LEFT, spacingBefore = 0, spacingAfter = AFTER, indent = 0 } = opts || {};
    children.push(
      new Paragraph({
        alignment: align,
        spacing: { before: spacingBefore, after: spacingAfter, line: LINE_SPACING },
        indent: indent ? { left: convertInchesToTwip(indent) } : undefined,
        children: [
          new TextRun({ text, bold, size, font: FONT }),
        ],
      })
    );
  };

  const addSeparator = () => {
    children.push(
      new Paragraph({
        spacing: { before: 80, after: 80 },
        border: {
          bottom: { color: "BBBBBB", space: 1, style: BorderStyle.SINGLE, size: 1 },
        },
        children: [],
      })
    );
  };

  // Title
  addBodyText(draft.title.toUpperCase(), { bold: true, size: HEADING, align: AlignmentType.CENTER, spacingAfter: 200 });

  // Date - right aligned
  children.push(
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { after: 200, line: LINE_SPACING },
      children: [
        new TextRun({ text: `Date: ${draft.date}`, size: BODY, font: FONT }),
      ],
    })
  );

  addSeparator();

  // Authority
  if (authority) {
    addBodyText("TO,", { spacingAfter: 60 });
    addBodyText(authority.addressedTo || "The Public Information Officer", { spacingAfter: 60 });
    addBodyText(authority.publicAuthority, { bold: true, spacingAfter: 60 });
    if (authority.department) addBodyText(`Department: ${authority.department}`, { spacingAfter: 60 });
    if (authority.officialAddress) addBodyText(authority.officialAddress, { spacingAfter: 60 });
    addSeparator();
  }

  // Subject
  children.push(
    new Paragraph({
      spacing: { before: 120, after: 120, line: LINE_SPACING },
      children: [
        new TextRun({ text: "SUBJECT: ", bold: true, size: BODY, font: FONT }),
        new TextRun({ text: draft.subject, size: BODY, font: FONT }),
      ],
    })
  );

  addSeparator();

  // Salutation
  addBodyText("Respected Sir/Madam,", { spacingAfter: 160 });

  // Introduction
  addBodyText(draft.introduction, { spacingAfter: 160 });

  // Requests heading
  addBodyText("I request the following information under the Right to Information Act, 2005:", { bold: true, spacingAfter: 120 });

  // Numbered requests
  draft.informationRequests.forEach((req, i) => {
    children.push(
      new Paragraph({
        spacing: { after: 100, line: LINE_SPACING },
        indent: { left: convertInchesToTwip(0.4) },
        children: [
          new TextRun({ text: `${i + 1}. `, bold: true, size: BODY, font: FONT }),
          new TextRun({ text: req.text, size: BODY, font: FONT }),
        ],
      })
    );
  });

  children.push(new Paragraph({ spacing: { after: 80 }, children: [] }));

  addSeparator();

  // Preferred format
  children.push(
    new Paragraph({
      spacing: { before: 80, after: 80, line: LINE_SPACING },
      children: [
        new TextRun({ text: "PREFERRED FORMAT: ", bold: true, size: BODY, font: FONT }),
        new TextRun({ text: draft.preferredFormat, size: BODY, font: FONT }),
      ],
    })
  );

  addSeparator();

  // Applicant details
  addBodyText("APPLICANT DETAILS:", { bold: true, spacingAfter: 80 });

  const applicantLines = [
    { label: "Name: ", value: draft.applicantName },
    { label: "Address: ", value: draft.applicantAddress },
    { label: "Email: ", value: draft.applicantEmail },
    { label: "Phone: ", value: draft.applicantPhone },
  ];

  for (const line of applicantLines) {
    children.push(
      new Paragraph({
        spacing: { after: 60, line: LINE_SPACING },
        children: [
          new TextRun({ text: line.label, bold: true, size: BODY, font: FONT }),
          new TextRun({ text: line.value, size: BODY, font: FONT }),
        ],
      })
    );
  }

  addSeparator();

  // Closing
  addBodyText(draft.closingStatement, { spacingAfter: 200 });

  // Signature block
  children.push(new Paragraph({ spacing: { after: 60 }, children: [] }));
  children.push(new Paragraph({ spacing: { after: 60 }, children: [] }));

  addBodyText("Yours faithfully,", { spacingAfter: 300 });

  children.push(
    new Paragraph({
      spacing: { after: 60, line: LINE_SPACING },
      children: [
        new TextRun({ text: "________________________", size: BODY, font: FONT }),
      ],
    })
  );

  addBodyText(`(${draft.applicantName})`, { spacingAfter: 60 });
  addBodyText(`Date: ${draft.date}`, { spacingAfter: 60 });

  // Source verification footer
  if (authority) {
    children.push(new Paragraph({ spacing: { before: 300 }, children: [] }));
    children.push(
      new Paragraph({
        border: {
          top: { color: "BBBBBB", space: 1, style: BorderStyle.SINGLE, size: 1 },
        },
        spacing: { before: 100, after: 60 },
        children: [
          new TextRun({ text: "SOURCE VERIFICATION", bold: true, size: SMALL, font: FONT, color: "888888" }),
        ],
      })
    );
    children.push(
      new Paragraph({
        spacing: { after: 40 },
        children: [
          new TextRun({ text: `Source: ${authority.sourceTitle}  |  Accessed: ${authority.dateAccessed}`, size: SMALL, font: FONT, color: "888888" }),
        ],
      })
    );
    if (!authority.verified) {
      children.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [
            new TextRun({ text: "Authority details could not be fully verified. Please verify before submission.", size: SMALL, font: FONT, color: "CC6600", italics: true }),
          ],
        })
      );
    }
  }

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
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 25;
  const marginRight = 25;
  const marginTop = 25;
  const marginBottom = 25;
  const contentWidth = pageWidth - marginLeft - marginRight;
  let y = marginTop;

  const checkPageBreak = (needed: number) => {
    if (y + needed > pageHeight - marginBottom) {
      doc.addPage();
      y = marginTop;
    }
  };

  const addText = (
    text: string,
    opts: {
      bold?: boolean;
      size?: number;
      align?: "left" | "center" | "right";
      spacingAfter?: number;
      color?: [number, number, number];
      indent?: number;
    } = {}
  ) => {
    const { bold = false, size = 12, align = "left", spacingAfter = 4, color = [30, 30, 30], indent = 0 } = opts;

    doc.setFont("times", bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(...color);

    const wrappedLines = doc.splitTextToSize(text, contentWidth - indent);
    const lineHeight = size * 0.5;

    for (const line of wrappedLines) {
      checkPageBreak(lineHeight + 2);
      const x = align === "center" ? pageWidth / 2 : align === "right" ? pageWidth - marginRight : marginLeft + indent;
      doc.text(line, x, y, { align, maxWidth: contentWidth - indent });
      y += lineHeight;
    }
    y += spacingAfter;
  };

  const addSeparator = () => {
    checkPageBreak(6);
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.2);
    doc.line(marginLeft, y, pageWidth - marginRight, y);
    y += 5;
  };

  // Title
  addText(draft.title.toUpperCase(), { bold: true, size: 16, align: "center", spacingAfter: 6 });

  // Date - right aligned
  addText(`Date: ${draft.date}`, { align: "right", size: 12, spacingAfter: 6 });

  addSeparator();

  // Authority
  if (authority) {
    addText("TO,", { spacingAfter: 2 });
    addText(authority.addressedTo || "The Public Information Officer", { spacingAfter: 2 });
    addText(authority.publicAuthority, { bold: true, spacingAfter: 2 });
    if (authority.department) addText(`Department: ${authority.department}`, { spacingAfter: 2 });
    if (authority.officialAddress) addText(authority.officialAddress, { spacingAfter: 4 });
    addSeparator();
  }

  // Subject
  addText(`SUBJECT: ${draft.subject}`, { bold: true, size: 12, spacingAfter: 6 });

  addSeparator();

  // Salutation
  addText("Respected Sir/Madam,", { spacingAfter: 6 });

  // Introduction - handle multi-paragraph
  const introParagraphs = draft.introduction.split(/\n+/);
  for (const para of introParagraphs) {
    if (para.trim()) addText(para.trim(), { spacingAfter: 4 });
  }

  y += 2;

  // Requests heading
  addText("I request the following information under the Right to Information Act, 2005:", { bold: true, spacingAfter: 4 });

  // Numbered requests
  draft.informationRequests.forEach((req, i) => {
    addText(`${i + 1}. ${req.text}`, { size: 12, spacingAfter: 4, indent: 4 });
  });

  y += 2;
  addSeparator();

  // Preferred format
  addText(`PREFERRED FORMAT: ${draft.preferredFormat}`, { spacingAfter: 4 });

  addSeparator();

  // Applicant details
  addText("APPLICANT DETAILS:", { bold: true, spacingAfter: 3 });
  addText(`Name: ${draft.applicantName}`, { spacingAfter: 2 });
  addText(`Address: ${draft.applicantAddress}`, { spacingAfter: 2 });
  addText(`Email: ${draft.applicantEmail}`, { spacingAfter: 2 });
  addText(`Phone: ${draft.applicantPhone}`, { spacingAfter: 4 });

  addSeparator();

  // Closing
  addText(draft.closingStatement, { spacingAfter: 8 });

  // Signature
  y += 8;
  addText("Yours faithfully,", { spacingAfter: 12 });
  addText("________________________", { spacingAfter: 3 });
  addText(`(${draft.applicantName})`, { spacingAfter: 3 });
  addText(`Date: ${draft.date}`, { spacingAfter: 6 });

  // Source verification
  if (authority) {
    addSeparator();
    addText("SOURCE VERIFICATION", { bold: true, size: 9, color: [120, 120, 120], spacingAfter: 2 });
    addText(`Source: ${authority.sourceTitle}  |  Accessed: ${authority.dateAccessed}`, { size: 9, color: [120, 120, 120], spacingAfter: 2 });
    if (!authority.verified) {
      addText("Authority details could not be fully verified. Please verify before submission.", { size: 9, color: [200, 100, 0], spacingAfter: 2 });
    }
  }

  // Page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("times", "normal");
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 12, { align: "center" });
  }

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
