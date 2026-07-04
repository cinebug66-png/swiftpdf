export type CompactToolSeoContent = {
  title: string;
  shortNote: string;
  steps: [string, string, string];
  faqs: { question: string; answer: string }[];
  relatedTools: string[];
};

export const compactNeedToKnowItems = [
  {
    title: "Quality",
    text: "Choose higher quality when you need sharper output.",
  },
  {
    title: "Download",
    text: "Save one file or download the full result after processing.",
  },
  {
    title: "Privacy",
    text: "Files are handled securely and are not used for training.",
  },
];

const defaultRelated = ["compress-pdf", "merge-pdf", "split-pdf"];

export const compactToolSeoContent: Record<string, CompactToolSeoContent> = {
  "pdf-to-word": {
    title: "Convert PDFs into editable Word files",
    shortNote:
      "Use PDF to Word when you need to revise text, reuse a report, or update a document without rebuilding it from scratch. Upload your PDF, run the conversion, then download a DOCX file you can open in Word or another editor. Results can vary with scanned pages and complex layouts, so review the downloaded file before sending it on.",
    steps: ["Upload your PDF", "Start the conversion", "Download your DOCX"],
    faqs: [
      { question: "Is PDF to Word free?", answer: "Yes. You can convert PDFs without signing up." },
      { question: "Will formatting stay the same?", answer: "Most simple layouts convert well, but complex files should be reviewed." },
      { question: "What output do I get?", answer: "The tool creates an editable DOCX file." },
    ],
    relatedTools: ["word-to-pdf", "compress-pdf", "pdf-to-jpg"],
  },
  "word-to-pdf": {
    title: "Create a clean PDF from Word",
    shortNote:
      "Word to PDF is useful when a document is ready to share, submit, or archive. Choose a DOC or DOCX file, convert it, and download a PDF that is easier to open consistently across devices. Before sharing, check the final PDF for page breaks, fonts, and spacing, especially if the original document uses custom formatting.",
    steps: ["Upload your Word file", "Convert to PDF", "Download the PDF"],
    faqs: [
      { question: "Which Word files work?", answer: "DOC and DOCX files are supported." },
      { question: "Do I need an account?", answer: "No. The converter can be used without signup." },
      { question: "Is the PDF ready to share?", answer: "Yes, but review it once if the Word file has complex formatting." },
    ],
    relatedTools: ["pdf-to-word", "compress-pdf", "protect-pdf"],
  },
  "pdf-to-jpg": {
    title: "Turn PDF pages into JPG images",
    shortNote:
      "PDF to JPG helps when a document page needs to behave like a normal image for previews, slides, websites, or quick sharing. Upload a PDF, choose the quality level, and convert each page into a separate JPG. You can save one page or download the full set, keeping the original PDF as your master copy.",
    steps: ["Upload your PDF", "Choose JPG quality", "Download JPG images"],
    faqs: [
      { question: "Does it convert every page?", answer: "Yes. Each PDF page becomes its own JPG image." },
      { question: "Can I download one page?", answer: "Yes. Individual page downloads are available after conversion." },
      { question: "Which quality should I use?", answer: "Use High for detail, Medium for balance, and Low for smaller files." },
    ],
    relatedTools: ["pdf-to-png", "jpg-to-pdf", "extract-pages"],
  },
  "pdf-to-png": {
    title: "Export PDF pages as PNG images",
    shortNote:
      "PDF to PNG is a good choice for screenshots, diagrams, forms, and pages where crisp edges matter. Upload your PDF, convert the pages, and download PNG files for design work, documentation, or sharing. PNG files may be larger than JPG, but they preserve sharp details better for many visual documents.",
    steps: ["Upload your PDF", "Convert pages", "Download PNG files"],
    faqs: [
      { question: "When should I use PNG?", answer: "Use PNG for sharp text, diagrams, screenshots, and line art." },
      { question: "Are PNG files larger?", answer: "Often yes, because PNG keeps more visual detail." },
      { question: "Can I download all pages?", answer: "Yes. You can save pages individually or as a ZIP." },
    ],
    relatedTools: ["pdf-to-jpg", "jpg-to-pdf", "compress-pdf"],
  },
  "pdf-to-excel": {
    title: "Extract PDF tables into Excel",
    shortNote:
      "PDF to Excel helps turn readable rows from text-based PDFs into an XLSX spreadsheet. It works best for digital PDFs with simple tables, invoices, reports, and bank-style rows. Scanned documents usually need OCR, so review the preview and the downloaded file before using the data.",
    steps: ["Upload your PDF", "Preview extracted rows", "Download Excel file"],
    faqs: [
      { question: "Does PDF to Excel work with scanned PDFs?", answer: "Scanned PDFs need OCR, which is not supported in this MVP." },
      { question: "Will tables be perfect?", answer: "Simple tables work best. Complex layouts should be reviewed after export." },
      { question: "What file do I get?", answer: "The tool creates an XLSX workbook." },
    ],
    relatedTools: ["pdf-to-word", "pdf-to-jpg", "compress-pdf"],
  },
  "jpg-to-pdf": {
    title: "Combine images into one PDF",
    shortNote:
      "JPG to PDF helps turn receipts, scans, screenshots, or image sets into a single document. Add one or more JPG, PNG, or WEBP files, convert them, and download a PDF that is easier to send, store, or print. Arrange your source images before uploading if page order matters.",
    steps: ["Upload images", "Create the PDF", "Download your file"],
    faqs: [
      { question: "Can I add multiple images?", answer: "Yes. Multiple supported image files can be combined." },
      { question: "Which image types work?", answer: "JPG, PNG, and WEBP images are supported." },
      { question: "Is the output one PDF?", answer: "Yes. The selected images are combined into a PDF." },
    ],
    relatedTools: ["pdf-to-jpg", "pdf-to-png", "merge-pdf"],
  },
  "merge-pdf": {
    title: "Merge PDFs into one document",
    shortNote:
      "Merge PDF is useful when separate files belong in one package, such as forms, reports, receipts, or attachments. Add the PDFs you want to combine, confirm the file list, and download a single merged PDF. Review the order before processing so the final document reads correctly.",
    steps: ["Upload PDFs", "Check the order", "Download merged PDF"],
    faqs: [
      { question: "How many PDFs do I need?", answer: "Upload at least two PDFs to merge." },
      { question: "Can I remove a file?", answer: "Yes. Remove unwanted files before merging." },
      { question: "Does it change page content?", answer: "No. It combines the selected PDF pages into one file." },
    ],
    relatedTools: ["split-pdf", "compress-pdf", "reorder-pdf"],
  },
  "split-pdf": {
    title: "Split a PDF by page range",
    shortNote:
      "Split PDF helps create a smaller document from selected pages. Upload a PDF, enter the pages or ranges you want, and download a new file containing only that selection. It is handy for sending one chapter, one form section, or a smaller excerpt without sharing the full document.",
    steps: ["Upload your PDF", "Choose pages", "Download split PDF"],
    faqs: [
      { question: "Can I select page ranges?", answer: "Yes. Enter pages like 1-3 or 2,5,8." },
      { question: "Is the original changed?", answer: "No. The tool creates a new PDF copy." },
      { question: "Can I extract one page?", answer: "Yes. Choose a single page as the range." },
    ],
    relatedTools: ["merge-pdf", "extract-pages", "delete-pages"],
  },
  "extract-pages": {
    title: "Extract only the PDF pages you need",
    shortNote:
      "Extract PDF Pages lets you pull selected pages into a new document. Upload a PDF, click page previews or type a range, and download the extracted file. Use it when you need a focused copy for sharing, filing, or review while keeping the original document untouched.",
    steps: ["Upload your PDF", "Select pages", "Download extracted PDF"],
    faqs: [
      { question: "Can I preview pages?", answer: "Yes. Page cards help you pick the right pages." },
      { question: "Can I type ranges?", answer: "Yes. You can enter ranges instead of clicking each page." },
      { question: "Does it remove pages from my original?", answer: "No. It creates a separate extracted PDF." },
    ],
    relatedTools: ["split-pdf", "delete-pages", "merge-pdf"],
  },
  "crop-pdf": {
    title: "Crop PDF pages visually",
    shortNote:
      "Crop PDF helps trim page margins or keep only the area you need. Upload a PDF, adjust the crop margins while watching the overlay, and download a new cropped copy. Use current page mode for a single-page fix or all pages when a scanned document has consistent margins.",
    steps: ["Upload your PDF", "Adjust the crop area", "Download cropped PDF"],
    faqs: [
      { question: "Is Crop PDF free?", answer: "Yes. You can crop PDF pages without signing up." },
      { question: "Does it upload my PDF?", answer: "No. The crop is created in your browser." },
      { question: "Can I crop all pages?", answer: "Yes. Choose All pages before creating the cropped PDF." },
    ],
    relatedTools: ["rotate-pdf", "compress-pdf", "delete-pages"],
  },
  "compress-pdf": {
    title: "Reduce PDF file size",
    shortNote:
      "Compress PDF helps make large documents easier to upload, email, or store. Choose a PDF, run compression, and download a smaller version. Compression results depend on the file contents: image-heavy PDFs usually shrink more than simple text documents.",
    steps: ["Upload your PDF", "Compress the file", "Download smaller PDF"],
    faqs: [
      { question: "Will quality change?", answer: "Compression may reduce size by optimizing document assets." },
      { question: "When is it useful?", answer: "Use it before emailing, uploading, or archiving large PDFs." },
      { question: "Is signup required?", answer: "No. You can compress PDFs without an account." },
    ],
    relatedTools: ["merge-pdf", "pdf-to-jpg", "protect-pdf"],
  },
  "watermark-pdf": {
    title: "Add a text watermark to a PDF",
    shortNote:
      "Watermark PDF helps label files as draft, confidential, approved, or branded. Upload a PDF, enter your watermark text, adjust the style, and download a new watermarked copy. Use a readable opacity and placement so the label is clear without hiding important content.",
    steps: ["Upload your PDF", "Set watermark text", "Download watermarked PDF"],
    faqs: [
      { question: "Can I change placement?", answer: "Yes. Adjust placement and style before processing." },
      { question: "Is the source file changed?", answer: "No. You download a new copy." },
      { question: "What text should I use?", answer: "Short labels such as Draft, Confidential, or Approved work best." },
    ],
    relatedTools: ["protect-pdf", "sign-pdf", "compress-pdf"],
  },
  "rotate-pdf": {
    title: "Fix PDF page orientation",
    shortNote:
      "Rotate PDF is useful when scanned or exported pages appear sideways or upside down. Upload the document, choose a 90, 180, or 270 degree rotation, preview the direction, and download a corrected copy. The tool keeps the workflow simple for quick orientation fixes.",
    steps: ["Upload your PDF", "Choose rotation", "Download rotated PDF"],
    faqs: [
      { question: "Which angles are available?", answer: "You can rotate pages by 90, 180, or 270 degrees." },
      { question: "Can I preview the result?", answer: "Yes. A preview helps confirm the direction." },
      { question: "Does it rotate every page?", answer: "Yes. The selected rotation is applied to the document." },
    ],
    relatedTools: ["reorder-pdf", "delete-pages", "compress-pdf"],
  },
  "delete-pages": {
    title: "Remove unwanted PDF pages",
    shortNote:
      "Delete PDF Pages helps clean up documents by removing blank, duplicate, or unnecessary pages. Upload a PDF, mark the pages to remove, and download a new updated file. Always review the selection before processing so important pages are not removed by mistake.",
    steps: ["Upload your PDF", "Mark pages to remove", "Download updated PDF"],
    faqs: [
      { question: "Can I see page previews?", answer: "Yes. Page previews help identify pages to remove." },
      { question: "Is the original deleted?", answer: "No. The tool creates a new PDF copy." },
      { question: "Can I remove several pages?", answer: "Yes. Select all pages you want removed before processing." },
    ],
    relatedTools: ["extract-pages", "split-pdf", "reorder-pdf"],
  },
  "reorder-pdf": {
    title: "Rearrange PDF page order",
    shortNote:
      "Reorder PDF helps fix page sequence before sharing or filing a document. Upload a PDF, drag pages into the right order, and download the updated copy. It is useful for scans, assembled reports, or documents where pages were exported in the wrong sequence.",
    steps: ["Upload your PDF", "Reorder pages", "Download reordered PDF"],
    faqs: [
      { question: "Can I drag pages?", answer: "Yes. Move pages into the order you need." },
      { question: "Does it change page content?", answer: "No. It only changes page order." },
      { question: "Should I review before download?", answer: "Yes. Check the displayed order before processing." },
    ],
    relatedTools: ["delete-pages", "merge-pdf", "rotate-pdf"],
  },
  "add-page-numbers": {
    title: "Add page numbers to a PDF",
    shortNote:
      "Add Page Numbers helps make long PDFs easier to reference. Upload a document, choose position and numbering style, preview the placement, and download a numbered copy. Keep numbers away from important text, signatures, or footers for a cleaner final result.",
    steps: ["Upload your PDF", "Choose numbering", "Download numbered PDF"],
    faqs: [
      { question: "Can I choose position?", answer: "Yes. Pick where page numbers should appear." },
      { question: "Can I preview numbers?", answer: "Yes. Preview helps confirm placement." },
      { question: "Is the source file changed?", answer: "No. A new numbered PDF is created." },
    ],
    relatedTools: ["watermark-pdf", "reorder-pdf", "compress-pdf"],
  },
  "protect-pdf": {
    title: "Password protect a PDF",
    shortNote:
      "Protect PDF helps add a password before sending or storing a sensitive document. Upload a PDF, set a password, and download an encrypted copy. Keep the password somewhere safe, because recipients will need it to open the protected file.",
    steps: ["Upload your PDF", "Set a password", "Download protected PDF"],
    faqs: [
      { question: "Should I save the password?", answer: "Yes. You will need it to open the protected PDF." },
      { question: "Is the output encrypted?", answer: "Yes. The downloaded PDF is password protected." },
      { question: "Can I remove protection later?", answer: "Use Unlock PDF if you know the password." },
    ],
    relatedTools: ["unlock-pdf", "watermark-pdf", "sign-pdf"],
  },
  "unlock-pdf": {
    title: "Unlock a password-protected PDF",
    shortNote:
      "Unlock PDF is for documents you are allowed to open and already know the password for. Upload the protected PDF, enter its password, and download an unlocked copy. This is useful when you need to archive, merge, or edit a file without repeatedly entering the password.",
    steps: ["Upload protected PDF", "Enter password", "Download unlocked PDF"],
    faqs: [
      { question: "Do I need the password?", answer: "Yes. The tool is for PDFs you can legally open." },
      { question: "Can it unlock any PDF?", answer: "No. It needs the correct password." },
      { question: "What happens after unlock?", answer: "You download a new PDF copy without the password prompt." },
    ],
    relatedTools: ["protect-pdf", "merge-pdf", "compress-pdf"],
  },
  "sign-pdf": {
    title: "Add a signature to a PDF",
    shortNote:
      "Sign PDF helps place a signature on a document without printing it first. Upload a PDF, create or upload a signature, position it on the preview, and download the signed copy. Review the placement carefully before sharing the final document.",
    steps: ["Upload your PDF", "Place signature", "Download signed PDF"],
    faqs: [
      { question: "Can I draw a signature?", answer: "Yes. You can draw, type, or upload a signature image." },
      { question: "Can I move the signature?", answer: "Yes. Position it on the preview before exporting." },
      { question: "Is the original changed?", answer: "No. You download a signed copy." },
    ],
    relatedTools: ["protect-pdf", "watermark-pdf", "pdf-to-word"],
  },
};

export function getCompactToolSeoContent(slug: string): CompactToolSeoContent | undefined {
  return compactToolSeoContent[slug];
}

export function getCompactToolSeoContentOrFallback(slug: string, toolName: string) {
  return (
    getCompactToolSeoContent(slug) ?? {
      title: `${toolName} help`,
      shortNote:
        "Use this tool to complete a focused PDF task without installing extra software. Upload your file, review the available settings, and download the finished result. Keep a copy of the original file so you can compare the output before sharing it.",
      steps: ["Upload your file", "Choose settings", "Download the result"] as [string, string, string],
      faqs: [
        { question: `Is ${toolName} free?`, answer: "Yes. You can use the tool without signup." },
        { question: "Should I review the output?", answer: "Yes. Always check the downloaded file before sharing." },
        { question: "Is my original file changed?", answer: "No. The tool creates a new output file." },
      ],
      relatedTools: defaultRelated,
    }
  );
}
