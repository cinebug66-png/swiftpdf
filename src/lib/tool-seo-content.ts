export type ToolSeoContent = {
  heading: string;
  intro: [string, string];
  note?: string;
  steps: { title: string; description: string }[];
  why: string;
  whyPoints: string[];
  faqs: { q: string; a: string }[];
  related: string[];
};

export const toolSeoContent: Record<string, ToolSeoContent> = {
  "pdf-to-word": {
    heading: "Convert PDF to Editable Word Documents",
    intro: [
      "A PDF is excellent for sharing a finished document, but it becomes inconvenient when text, tables, or formatting needs another round of editing. SwiftPDF’s PDF to Word tool creates an editable DOCX copy so reports, contracts, assignments, and business documents can move back into a familiar word-processing workflow.",
      "The conversion flow is intentionally simple: choose a PDF, let SwiftPDF process it, and download the Word file. Clear file states and direct downloads keep the task focused. The tool is useful when recreating a document manually would take longer than reviewing and polishing a converted copy.",
    ],
    steps: [
      { title: "Upload the PDF", description: "Choose the document you want to make editable." },
      { title: "Start conversion", description: "SwiftPDF prepares the file for DOCX output." },
      { title: "Review the result", description: "Open the Word file and check complex layouts." },
      { title: "Continue editing", description: "Update text, tables, and styling in Word." },
    ],
    why: "Use PDF to Word when the content matters more than preserving a locked final format. It reduces retyping and gives you a practical starting point for revisions.",
    whyPoints: [
      "Recover editable text from reports",
      "Revise proposals and agreements",
      "Reuse tables and document structure",
      "Prepare content for collaborative editing",
    ],
    faqs: [
      {
        q: "Will the Word file match the PDF exactly?",
        a: "Simple text documents usually convert cleanly. Complex columns, uncommon fonts, or scanned pages may need small layout adjustments after conversion.",
      },
      {
        q: "Can I edit the downloaded DOCX?",
        a: "Yes. The result is designed to open in Microsoft Word and compatible editors so you can revise the document.",
      },
      {
        q: "Does PDF to Word work with scanned documents?",
        a: "Image-only scans may not contain editable text. Results depend on whether usable text information exists in the source PDF.",
      },
      {
        q: "What should I check after conversion?",
        a: "Review page breaks, tables, headers, and custom fonts before using the DOCX as a final business document.",
      },
      {
        q: "Do I need to install Word to convert?",
        a: "No installation is required for conversion, although a DOCX-compatible application is needed to edit the downloaded file.",
      },
    ],
    related: ["word-to-pdf", "compress-pdf", "merge-pdf", "extract-pages"],
  },
  "word-to-pdf": {
    heading: "Create a Shareable PDF from Word",
    intro: [
      "Word documents are easy to edit, but their appearance can shift between devices, fonts, and office applications. Converting a DOC or DOCX file to PDF creates a more dependable version for applications, invoices, coursework, proposals, and records that should keep a consistent presentation.",
      "SwiftPDF keeps the workflow direct: upload the Word document, convert it, and save the PDF. A PDF is easier to archive, print, and send without inviting accidental edits. It also gives recipients a format that opens reliably in browsers and standard document viewers.",
    ],
    note: "For the cleanest result, finish tracked changes, accept comments that should not remain visible, and save the Word file before uploading. A quick review of the generated PDF is especially worthwhile when the source uses custom fonts, section breaks, or floating text boxes.",
    steps: [
      { title: "Choose a Word file", description: "Upload a DOC or DOCX document." },
      { title: "Convert to PDF", description: "SwiftPDF prepares a stable PDF version." },
      { title: "Check key pages", description: "Review page breaks and important formatting." },
      { title: "Download and share", description: "Save the finished PDF to your device." },
    ],
    why: "Use Word to PDF when a document is ready to leave the editing stage. The PDF copy is better suited to distribution, printing, and long-term storage.",
    whyPoints: [
      "Share documents without easy editing",
      "Keep a consistent printable format",
      "Submit resumes and assignments",
      "Archive finalized Word content",
    ],
    faqs: [
      {
        q: "Which Word formats are accepted?",
        a: "SwiftPDF accepts common DOC and DOCX files. Use DOCX when possible for the most predictable modern document structure.",
      },
      {
        q: "Will page breaks stay the same?",
        a: "Most standard documents convert predictably, but uncommon fonts, floating objects, and advanced layouts should be reviewed afterward.",
      },
      {
        q: "Can I convert a document with images?",
        a: "Yes. Images embedded in the Word file are included in the resulting PDF when the document can be processed correctly.",
      },
      {
        q: "Why convert Word to PDF before sending?",
        a: "PDF reduces accidental editing and generally presents more consistently across recipients’ devices and applications.",
      },
      {
        q: "Can I edit the PDF later?",
        a: "PDF is intended as a final format. Keep the original Word document if you expect to make substantial future revisions.",
      },
    ],
    related: ["pdf-to-word", "compress-pdf", "protect-pdf", "sign-pdf"],
  },
  "pdf-to-jpg": {
    heading: "Turn Every PDF Page into a JPG Image",
    intro: [
      "PDF pages are not always convenient for websites, presentations, messaging apps, or platforms that expect standard images. PDF to JPG renders each page as a separate image, making visual content easier to preview, publish, crop, or share without asking the recipient to open a document viewer.",
      "SwiftPDF performs the rendering in your browser with PDF.js. You can select an image-quality level, watch page-by-page progress, inspect the generated previews, and download one JPG or a ZIP containing the complete set. Page-based filenames keep multi-page exports organized.",
    ],
    note: "Before converting, consider how the images will be used. A high-quality export is appropriate for print or detailed text, while a smaller setting may be more practical for quick previews, messaging, and web publishing where download speed matters.",
    steps: [
      { title: "Upload your PDF", description: "Choose a valid single or multi-page document." },
      { title: "Choose JPG quality", description: "Balance clarity and output file size." },
      { title: "Convert the pages", description: "PDF.js renders each page as an image." },
      { title: "Download images", description: "Save one JPG or download every page as ZIP." },
    ],
    why: "JPG is widely supported and compact, making it a practical choice for page previews, social posts, email attachments, and image-based workflows.",
    whyPoints: [
      "Share a page in chat or email",
      "Create document thumbnails",
      "Publish pages on websites",
      "Save individual illustrations or slides",
    ],
    faqs: [
      {
        q: "Does PDF to JPG upload my document?",
        a: "No. PDF.js renders the pages locally in your browser, so the conversion does not require a remote conversion API.",
      },
      {
        q: "Which quality setting should I use?",
        a: "High is best for detailed pages, Medium balances size and clarity, and Low is useful when smaller downloads matter most.",
      },
      {
        q: "Can I download only one page?",
        a: "Yes. Every preview card includes its own JPG download button, while the ZIP option packages all converted pages.",
      },
      {
        q: "Are multi-page PDFs supported?",
        a: "Yes. SwiftPDF converts every page and numbers the filenames so the exported images remain in sequence.",
      },
      {
        q: "Why is JPG smaller than PNG?",
        a: "JPG uses lossy compression, which often produces smaller files for photographs and visually complex pages.",
      },
    ],
    related: ["pdf-to-png", "jpg-to-pdf", "extract-pages", "compress-pdf"],
  },
  "pdf-to-png": {
    heading: "Export PDF Pages as High-Quality PNG Images",
    intro: [
      "PNG is a strong choice when sharp text, diagrams, interface screenshots, or lossless image quality matters. SwiftPDF’s PDF to PNG converter renders each document page at high resolution and exports it as a separate PNG without relying on a paid conversion service or backend upload.",
      "After selecting a PDF, the tool reads its page count, shows conversion progress, and creates compact preview cards with dimensions and output sizes. Download a specific page immediately or package every PNG into a ZIP. The browser-based flow works especially well for manuals, slide decks, charts, and design references.",
    ],
    steps: [
      { title: "Select a PDF", description: "Upload the document from your device." },
      { title: "Read page details", description: "SwiftPDF validates the file and counts pages." },
      { title: "Render as PNG", description: "Each page is drawn with PDF.js at high resolution." },
      {
        title: "Save your images",
        description: "Download individually or collect all pages in ZIP.",
      },
    ],
    why: "Choose PNG when clean edges and lossless output are more important than creating the smallest possible image files.",
    whyPoints: [
      "Capture charts and technical diagrams",
      "Preserve crisp text in image form",
      "Create lossless page archives",
      "Prepare assets for design tools",
    ],
    faqs: [
      {
        q: "How is PNG different from JPG?",
        a: "PNG uses lossless compression and usually keeps text and line art sharper, while JPG often creates smaller files for photographs.",
      },
      {
        q: "Is the PDF sent to a server?",
        a: "No. The document is rendered directly in your browser with PDF.js and the PNG files are created on your device.",
      },
      {
        q: "Can I convert a long PDF?",
        a: "Yes. Multi-page documents are supported, although large or highly detailed PDFs require more browser memory and processing time.",
      },
      {
        q: "Can I download all PNG files together?",
        a: "Yes. SwiftPDF uses JSZip to create one ZIP containing every converted page with ordered filenames.",
      },
      {
        q: "Will PNG preserve transparency?",
        a: "PDF page appearance determines the rendered background. The output preserves what PDF.js draws onto the PNG canvas.",
      },
    ],
    related: ["pdf-to-jpg", "jpg-to-pdf", "extract-pages", "compress-pdf"],
  },
  "jpg-to-pdf": {
    heading: "Combine Images into One Organized PDF",
    intro: [
      "Loose JPG, PNG, and WEBP images can be difficult to send as a single assignment, scan, receipt bundle, or photo record. JPG to PDF combines supported images into one document so recipients can open, print, archive, and share the collection in a predictable order.",
      "Add one image or several, review the selected files, and create the PDF when the sequence is ready. SwiftPDF fits each image onto its own PDF page, avoiding the repetitive work of inserting pictures manually into another application. The result is a convenient document made from the images you selected.",
    ],
    note: "For a polished document, rotate phone photos before upload and use images with similar margins where possible. Clear, evenly lit scans create a more consistent PDF and reduce the need for recipients to zoom or turn individual pages.",
    steps: [
      { title: "Add your images", description: "Choose JPG, PNG, or WEBP files." },
      { title: "Review the list", description: "Confirm that the intended images are included." },
      { title: "Create the PDF", description: "SwiftPDF places images into a document." },
      { title: "Download the result", description: "Save the combined PDF to your device." },
    ],
    why: "Use JPG to PDF when multiple image files belong together and should be shared as one portable, printable document.",
    whyPoints: [
      "Bundle scanned pages",
      "Combine receipts or invoices",
      "Submit photographed assignments",
      "Create a simple image portfolio",
    ],
    faqs: [
      {
        q: "Can I mix JPG, PNG, and WEBP files?",
        a: "Yes. Supported image types can be added together and converted into a single PDF document.",
      },
      {
        q: "Does each image become a separate page?",
        a: "Yes. Images are fitted onto individual PDF pages to keep the result clear and easy to navigate.",
      },
      {
        q: "Will portrait and landscape images work?",
        a: "Yes. SwiftPDF handles common image orientations and fits each image within its generated page.",
      },
      {
        q: "Can I use phone photos?",
        a: "Yes. Photos and scans saved in a supported format can be combined, though very large images may take longer to process.",
      },
      {
        q: "Should I compress the finished PDF?",
        a: "If the source images are large, the final document may also be large. Use Compress PDF afterward when easier sharing is important.",
      },
    ],
    related: ["pdf-to-jpg", "pdf-to-png", "merge-pdf", "compress-pdf"],
  },
  "merge-pdf": {
    heading: "Combine Multiple PDFs into a Single Document",
    intro: [
      "Related PDFs often arrive as separate chapters, invoices, forms, or supporting documents. Merge PDF joins those files into one continuous document, reducing attachment clutter and making the final package easier to store, review, print, and send.",
      "Upload multiple PDF files, check their displayed order, remove anything added by mistake, and start the merge. SwiftPDF copies the pages into a new document in the same file sequence shown on screen. The original files remain unchanged, giving you a separate combined result.",
    ],
    note: "Name source files clearly before uploading when the sequence is important. A simple numeric prefix can make the intended order easier to confirm, particularly when combining many chapters, exhibits, or records with similar filenames.",
    steps: [
      { title: "Upload PDFs", description: "Select two or more documents to combine." },
      { title: "Check file order", description: "Confirm the sequence before processing." },
      { title: "Merge documents", description: "SwiftPDF copies pages into one PDF." },
      { title: "Download the file", description: "Save the completed combined document." },
    ],
    why: "Merging creates one dependable package from documents that belong together, saving recipients from opening and organizing several attachments.",
    whyPoints: [
      "Assemble reports and appendices",
      "Combine monthly statements",
      "Join chapters or course notes",
      "Create one client delivery file",
    ],
    faqs: [
      {
        q: "What determines the page order?",
        a: "Files are merged in the order displayed in the upload list, and pages within each source PDF keep their original order.",
      },
      {
        q: "Can I remove a file before merging?",
        a: "Yes. Remove unintended documents from the selected list before starting the merge.",
      },
      {
        q: "Does merging reduce page quality?",
        a: "The tool combines existing PDF pages rather than converting them into images, so original page content is preserved.",
      },
      {
        q: "How many PDFs can I combine?",
        a: "You can add multiple files, but practical limits depend on their size and the memory available in your browser or device.",
      },
      {
        q: "Can I reorder individual pages too?",
        a: "Merge PDF controls file sequence. Use Reorder PDF Pages afterward when specific pages need a different arrangement.",
      },
    ],
    related: ["reorder-pdf", "split-pdf", "compress-pdf", "protect-pdf"],
  },
  "split-pdf": {
    heading: "Split a PDF and Keep Only the Pages You Need",
    intro: [
      "Large PDFs often contain several sections when only a few pages need to be shared. Split PDF creates a smaller document from selected page numbers or ranges, helping you separate chapters, forms, extracts, and handouts without modifying the original file.",
      "Enter a single page, a continuous range, or a mixed selection such as 1-3,5,8-10. SwiftPDF validates the request against the document length before generating the result. This makes it easier to avoid missing pages or asking for page numbers that do not exist.",
    ],
    note: "It helps to open the source PDF beside the tool when page labels printed in the document differ from the viewer’s numeric page count. Always select pages using the actual PDF positions recognized by the browser.",
    steps: [
      { title: "Upload the PDF", description: "Choose the document you want to divide." },
      { title: "Enter page ranges", description: "Specify single pages or combined ranges." },
      { title: "Validate selection", description: "SwiftPDF checks pages against the source." },
      {
        title: "Download the split PDF",
        description: "Save a new file containing your selection.",
      },
    ],
    why: "Splitting is ideal when a focused subset is easier to send, review, or archive than the complete source document.",
    whyPoints: [
      "Separate a chapter from an ebook",
      "Share selected contract pages",
      "Create a focused student handout",
      "Reduce unnecessary document pages",
    ],
    faqs: [
      {
        q: "Which page-range formats are supported?",
        a: "Use single pages, ranges, or combinations such as 3, 1-5, or 1-3,5,7-9.",
      },
      {
        q: "Does Split PDF change the original?",
        a: "No. SwiftPDF creates a new PDF from the selected pages and leaves your uploaded source unchanged.",
      },
      {
        q: "What happens with an invalid page number?",
        a: "The tool shows a validation message when a page is missing, malformed, or outside the document’s page count.",
      },
      {
        q: "Can I make several PDFs at once?",
        a: "This workflow creates one PDF from the current selection. Run it again for each additional section you need.",
      },
      {
        q: "Is splitting the same as deleting pages?",
        a: "Splitting selects pages to keep in a new file. Delete PDF Pages is more convenient when choosing a smaller set to remove.",
      },
    ],
    related: ["extract-pages", "delete-pages", "merge-pdf", "reorder-pdf"],
  },
  "compress-pdf": {
    heading: "Reduce PDF File Size for Easier Sharing",
    intro: [
      "Oversized PDFs can be rejected by upload forms, take too long to send, and consume unnecessary storage. Compress PDF creates a lighter copy designed for email, web uploads, messaging, and routine archiving while keeping the document useful and readable.",
      "Upload the source file and let SwiftPDF optimize it. When processing finishes, the result view compares available size information so you can judge whether the reduction fits your needs. Compression results vary because scanned images, photographs, fonts, and already optimized PDFs behave differently.",
    ],
    note: "Keep the original document until you have inspected the compressed copy. Pages containing small diagrams, signatures, or dense scans deserve extra attention because those details reveal quality changes more quickly than ordinary paragraph text.",
    steps: [
      { title: "Choose a PDF", description: "Upload the document that is too large." },
      {
        title: "Start compression",
        description: "SwiftPDF processes the file for a smaller result.",
      },
      { title: "Compare sizes", description: "Review the original and compressed measurements." },
      { title: "Download the copy", description: "Save the optimized PDF separately." },
    ],
    why: "Compression removes friction when a document must fit an attachment limit or load more quickly without rebuilding the file from scratch.",
    whyPoints: [
      "Meet email attachment limits",
      "Speed up website uploads",
      "Save cloud storage space",
      "Share scanned documents more easily",
    ],
    faqs: [
      {
        q: "How much smaller will my PDF become?",
        a: "The reduction depends on the source. Image-heavy or unoptimized PDFs may shrink more than files that were already compressed.",
      },
      {
        q: "Will compression make text unreadable?",
        a: "SwiftPDF aims to balance size and clarity, but you should review important diagrams and fine print before distributing the result.",
      },
      {
        q: "Why did my PDF shrink only slightly?",
        a: "The file may already use efficient compression or contain content that cannot be reduced significantly without visible quality loss.",
      },
      {
        q: "Does the original file get replaced?",
        a: "No. The compressed PDF is downloaded as a separate copy, leaving the source document on your device unchanged.",
      },
      {
        q: "Can I compress after merging images?",
        a: "Yes. Compression is useful after JPG to PDF or Merge PDF when the combined result is larger than expected.",
      },
    ],
    related: ["merge-pdf", "jpg-to-pdf", "pdf-to-jpg", "protect-pdf"],
  },
  "extract-pages": {
    heading: "Visually Extract Selected Pages from a PDF",
    intro: [
      "Extract PDF Pages provides a visual way to build a new document from chosen pages. Instead of relying only on page numbers, you can inspect real thumbnails, click the pages you need, and combine that selection with typed ranges when working through a longer PDF.",
      "Selected cards use a clear blue state and checkmark, while the summary shows how many output pages will be created. SwiftPDF copies the original pages into a new PDF without rasterizing them, preserving text, vectors, images, and page dimensions from the source.",
    ],
    note: "Use the thumbnail grid for visually distinctive pages and the range field for long continuous sections. Combining both methods is often faster than counting through a large document one page at a time.",
    steps: [
      { title: "Open your PDF", description: "SwiftPDF loads page count and thumbnails." },
      { title: "Select pages", description: "Click cards or enter ranges such as 1,3-5." },
      { title: "Review the summary", description: "Confirm selected and output page totals." },
      { title: "Extract and download", description: "Create a new PDF from those pages." },
    ],
    why: "Visual extraction is especially helpful when page contents are easier to recognize than page numbers or when selections are scattered throughout a document.",
    whyPoints: [
      "Pick pages by appearance",
      "Preserve original PDF quality",
      "Build a custom document subset",
      "Avoid exporting unwanted sections",
    ],
    faqs: [
      {
        q: "Does extraction convert pages into images?",
        a: "No. SwiftPDF copies the original PDF pages into the new document, preserving their existing quality and structure.",
      },
      {
        q: "Can I use both thumbnails and a page range?",
        a: "Yes. Clicking cards updates the selection, and the range field supports single pages and combinations such as 1,3-5.",
      },
      {
        q: "Are thumbnails loaded for large PDFs?",
        a: "Yes. Preview rendering is lazy so pages are generated near the viewport instead of rendering every thumbnail immediately.",
      },
      {
        q: "What happens to unselected pages?",
        a: "They are not included in the extracted PDF. The source file itself remains unchanged.",
      },
      {
        q: "How is this different from Split PDF?",
        a: "Both create a selected subset, but Extract PDF Pages emphasizes visual thumbnail selection for easier page recognition.",
      },
    ],
    related: ["split-pdf", "delete-pages", "reorder-pdf", "merge-pdf"],
  },
  "delete-pages": {
    heading: "Remove Unwanted Pages from a PDF",
    intro: [
      "Delete PDF Pages is designed for cleaning a document while keeping everything else in place. Upload a PDF, inspect medium-size page thumbnails, and mark unwanted pages with the red deletion state. The summary updates the selected, remaining, and output totals before processing.",
      "You can click cards or type page ranges when many pages need removal. SwiftPDF prevents every page from being deleted, ensuring the output remains a valid PDF. The operation removes page objects from a new copy rather than reducing the retained pages to screenshots.",
    ],
    note: "Review the red overlays before processing, especially near chapter boundaries or appendices. The remaining-page total provides a useful final check when duplicate scans or several blank pages are being removed together.",
    steps: [
      { title: "Upload the document", description: "Load the PDF and its page previews." },
      { title: "Mark pages for deletion", description: "Click thumbnails or type page ranges." },
      { title: "Check remaining pages", description: "Use the summary to verify the output." },
      { title: "Delete and download", description: "Save the cleaned PDF as a new file." },
    ],
    why: "Deleting is faster than rebuilding a PDF when most pages should remain and only covers, blanks, duplicates, or outdated sections need removal.",
    whyPoints: [
      "Remove blank scanned pages",
      "Delete outdated attachments",
      "Clean duplicate content",
      "Prepare a shorter client copy",
    ],
    faqs: [
      {
        q: "Can I delete several page ranges?",
        a: "Yes. Enter comma-separated pages and ranges such as 1,3,5-7, or select the same pages visually.",
      },
      {
        q: "Can every page be removed?",
        a: "No. SwiftPDF requires at least one remaining page so the downloaded result is a valid PDF document.",
      },
      {
        q: "Do selected pages disappear immediately?",
        a: "No. They remain visible with a red overlay until you confirm deletion, making the planned result easy to review.",
      },
      {
        q: "Does deleting pages reduce the quality of pages I keep?",
        a: "No. Remaining pages are preserved as PDF pages instead of being rendered into lower-quality images.",
      },
      {
        q: "Is my original PDF modified?",
        a: "No. SwiftPDF creates a new updated file and does not overwrite the source on your device.",
      },
    ],
    related: ["extract-pages", "split-pdf", "reorder-pdf", "compress-pdf"],
  },
  "reorder-pdf": {
    heading: "Arrange PDF Pages in the Correct Order",
    intro: [
      "Page order can become scrambled after scanning, combining documents, or exporting from several sources. Reorder PDF Pages displays a visual card for each page and lets you drag pages into the sequence that makes sense before creating a corrected copy.",
      "Thumbnails and position labels make the current arrangement easy to understand. On touch devices, the page grip provides a clear drag target. SwiftPDF then copies the original pages into the chosen order, preserving their content rather than rebuilding the document from images.",
    ],
    note: "When repairing a long scan, move broad sections first and fine-tune individual pages afterward. Position labels make it easier to confirm the sequence without relying only on similar-looking thumbnails or handwritten page numbers.",
    steps: [
      { title: "Upload the PDF", description: "Wait while page thumbnails are prepared." },
      { title: "Drag page cards", description: "Move each page into its intended position." },
      { title: "Review positions", description: "Check page numbers and the complete sequence." },
      { title: "Save reordered PDF", description: "Create and download the corrected document." },
    ],
    why: "Reordering fixes document flow without requiring a PDF editor, rescanning pages, or splitting and merging files manually.",
    whyPoints: [
      "Correct scanned page order",
      "Move covers and appendices",
      "Arrange presentation handouts",
      "Organize combined paperwork",
    ],
    faqs: [
      {
        q: "Does dragging work on mobile?",
        a: "Yes. Use the visible grip control to drag page cards on touch devices as well as desktop browsers.",
      },
      {
        q: "Will page quality change?",
        a: "No. SwiftPDF copies original PDF pages into a new sequence without rasterizing their contents.",
      },
      {
        q: "Can I remove pages while reordering?",
        a: "This tool focuses on arrangement. Use Delete PDF Pages first or afterward when pages must also be removed.",
      },
      {
        q: "What do position numbers mean?",
        a: "They show where each original page currently appears in the new document order.",
      },
      {
        q: "Is the reordered file downloaded automatically?",
        a: "The tool creates a finished result and provides a download flow for saving the updated PDF.",
      },
    ],
    related: ["merge-pdf", "delete-pages", "extract-pages", "rotate-pdf"],
  },
  "add-page-numbers": {
    heading: "Add Clear Page Numbers to Any PDF",
    intro: [
      "Page numbers make long documents easier to discuss, print, reference, and review. Add Page Numbers lets you choose the placement, number format, text size, margin, color, starting value, and whether a cover page should be skipped.",
      "A visual preview shows the numbering before the PDF is created, reducing guesswork around corners and margins. SwiftPDF applies the selected numbering consistently across the document and generates a new copy, leaving the source file untouched for future edits.",
    ],
    note: "Leave enough margin for printers that cannot reproduce content at the very edge of the paper. If the PDF already contains footer text, test a top position or adjust the margin so the new numbering remains distinct.",
    steps: [
      { title: "Upload a PDF", description: "Load the document and its page count." },
      {
        title: "Choose number settings",
        description: "Set position, format, size, color, and margin.",
      },
      { title: "Review the preview", description: "Confirm the number fits the page design." },
      { title: "Apply and download", description: "Create the numbered PDF and save it." },
    ],
    why: "Numbering adds navigation and professionalism to reports, manuals, submissions, meeting packs, and printed documents.",
    whyPoints: [
      "Reference pages during review",
      "Number reports and manuals",
      "Skip an unnumbered cover",
      "Create consistent printed packets",
    ],
    faqs: [
      {
        q: "Where can page numbers be placed?",
        a: "Choose top or bottom placement aligned left, center, or right to suit the document layout.",
      },
      {
        q: "Can the first page be skipped?",
        a: "Yes. Enable the skip-first-page option when a title page or cover should remain unnumbered.",
      },
      {
        q: "Can numbering start above one?",
        a: "Yes. Set a custom starting value when the PDF continues an existing document or chapter sequence.",
      },
      {
        q: "Which number formats are available?",
        a: "The tool supports a plain number, “Page 1,” and “Page 1 of 10” style formats.",
      },
      {
        q: "Does adding numbers cover existing content?",
        a: "Placement depends on your selected margin and the original page design. Use the preview to avoid important text or graphics.",
      },
    ],
    related: ["watermark-pdf", "sign-pdf", "reorder-pdf", "protect-pdf"],
  },
  "watermark-pdf": {
    heading: "Add a Custom Text Watermark to PDF Pages",
    intro: [
      "A watermark can identify ownership, communicate document status, or discourage casual reuse. Watermark PDF applies your chosen text across the document with controls for size, opacity, and rotation, making it suitable for labels such as Draft, Confidential, Sample, or a business name.",
      "The preview helps you balance visibility with readability before processing. A subtle watermark can preserve the underlying content, while a stronger diagonal treatment is useful when status needs to remain obvious in screenshots and printed copies.",
    ],
    note: "Choose wording that remains meaningful if a page is viewed separately from the full document. Short labels are usually more legible, while a business name or reference code can help identify where a distributed copy originated.",
    steps: [
      { title: "Upload the PDF", description: "Choose the document that needs a label." },
      { title: "Enter watermark text", description: "Use a status, name, or ownership notice." },
      { title: "Adjust appearance", description: "Set rotation, opacity, and text size." },
      { title: "Apply and save", description: "Create the watermarked PDF copy." },
    ],
    why: "Watermarks provide a visible, repeatable signal across every page without manually editing the document in a design application.",
    whyPoints: [
      "Mark drafts before review",
      "Label confidential copies",
      "Add ownership or brand text",
      "Identify samples and proofs",
    ],
    faqs: [
      {
        q: "Is the watermark added to every page?",
        a: "Yes. The selected text and style are applied consistently throughout the PDF.",
      },
      {
        q: "Can I make the watermark subtle?",
        a: "Yes. Lower the opacity and choose an appropriate size so the document remains easy to read.",
      },
      {
        q: "What rotation works well for a draft watermark?",
        a: "A diagonal angle is commonly used because it remains visible across varied page layouts without resembling normal body text.",
      },
      {
        q: "Can I add an image watermark?",
        a: "This workflow focuses on text watermarks. Use concise text for reliable placement across all pages.",
      },
      {
        q: "Does watermarking protect against all copying?",
        a: "No visible watermark provides complete copy protection, but it clearly communicates ownership, status, or intended use.",
      },
    ],
    related: ["add-page-numbers", "protect-pdf", "sign-pdf", "compress-pdf"],
  },
  "rotate-pdf": {
    heading: "Correct PDF Page Orientation",
    intro: [
      "Sideways and upside-down pages are common after mobile scanning, photocopying, or combining documents from different sources. Rotate PDF corrects page orientation by applying a 90, 180, or 270 degree turn and saving the result as a new document.",
      "The selected rotation is easy to preview before processing, helping you distinguish clockwise and upside-down corrections. Rotation changes how the pages are presented without turning them into images, so text, vectors, and embedded document quality remain intact.",
    ],
    note: "Rotation is most useful when every page shares the same incorrect orientation. If only selected pages are sideways, separate or extract those pages first, correct them as needed, and then merge the document back into its intended sequence. Review landscape tables and wide diagrams afterward to confirm their reading direction also matches the surrounding document.",
    steps: [
      { title: "Select the PDF", description: "Upload the document with incorrect orientation." },
      { title: "Choose rotation", description: "Pick 90, 180, or 270 degrees." },
      { title: "Check the preview", description: "Confirm the page reads in the right direction." },
      { title: "Rotate and download", description: "Save the corrected PDF copy." },
    ],
    why: "Rotation provides a quick correction for documents that are otherwise complete, avoiding rescanning or rebuilding pages.",
    whyPoints: [
      "Fix sideways phone scans",
      "Correct upside-down pages",
      "Prepare PDFs for printing",
      "Standardize document orientation",
    ],
    faqs: [
      {
        q: "Which rotation angles are supported?",
        a: "Choose 90 degrees, 180 degrees, or 270 degrees depending on the current page direction.",
      },
      {
        q: "Does rotation reduce PDF quality?",
        a: "No. The operation changes page orientation without converting the page content into an image.",
      },
      {
        q: "Will all pages be rotated?",
        a: "The current tool applies the selected rotation consistently to the document pages.",
      },
      {
        q: "How do I know which direction to choose?",
        a: "Use the visual preview and switch angles until the page content appears upright.",
      },
      {
        q: "Can I reorder pages after rotating?",
        a: "Yes. Download the corrected PDF, then use Reorder PDF Pages if its sequence also needs adjustment.",
      },
    ],
    related: ["reorder-pdf", "merge-pdf", "delete-pages", "sign-pdf"],
  },
  "protect-pdf": {
    heading: "Add Password Protection to a PDF",
    intro: [
      "Sensitive PDFs may contain personal records, contracts, invoices, or internal information that should not open freely when forwarded or stored. Protect PDF creates an encrypted copy that requires the password you choose before the document can be accessed.",
      "SwiftPDF validates the password and confirmation before processing, helping prevent simple entry mistakes. The finished protected file is offered as a separate download. Store the password securely because recipients will need it, and losing it may make the document difficult or impossible to recover.",
    ],
    note: "Test the protected download before distributing it and confirm that the intended password opens the file. Keep an authorized unprotected original in secure storage so future edits do not depend on remembering the distribution password.",
    steps: [
      {
        title: "Upload the PDF",
        description: "Choose the document you are authorized to protect.",
      },
      { title: "Create a password", description: "Use a strong, unique phrase or combination." },
      { title: "Confirm the password", description: "Re-enter it to prevent typing errors." },
      { title: "Protect and download", description: "Save the encrypted PDF copy." },
    ],
    why: "Password protection adds an access barrier when documents are emailed, shared through storage services, or kept on devices used by several people.",
    whyPoints: [
      "Secure confidential reports",
      "Protect personal documents",
      "Send sensitive attachments",
      "Control casual document access",
    ],
    faqs: [
      {
        q: "What makes a strong PDF password?",
        a: "Use a long, unique password with unrelated words or a mix of letters, numbers, and symbols that is not reused elsewhere.",
      },
      {
        q: "Does SwiftPDF store my password?",
        a: "The tool does not intentionally store or log the password, and password fields are cleared as part of the workflow.",
      },
      {
        q: "What if I forget the password?",
        a: "Keep a secure record. Password-protected documents may be inaccessible without the correct password.",
      },
      {
        q: "Is password protection the same as redaction?",
        a: "No. Encryption controls opening the file; it does not permanently remove sensitive text or images from the PDF.",
      },
      {
        q: "Should I send the password with the PDF?",
        a: "For sensitive material, share the password through a separate trusted communication channel.",
      },
    ],
    related: ["unlock-pdf", "sign-pdf", "watermark-pdf", "compress-pdf"],
  },
  "unlock-pdf": {
    heading: "Remove a Known Password from Your PDF",
    intro: [
      "Unlock PDF creates an unprotected copy of a password-secured document when you know the current password and have permission to remove the restriction. This is useful for files you own that must be opened repeatedly, processed by another tool, or shared in an approved workflow.",
      "Enter the existing password, allow SwiftPDF to verify and process the document, then download the unlocked copy. The source protected PDF remains unchanged. Because removing access controls affects document security, use the tool only for files you are authorized to manage.",
    ],
    note: "After unlocking, treat the new copy according to the sensitivity of its contents. Removing the password improves convenience but also removes an access control, so avoid leaving the result in shared downloads or public storage.",
    steps: [
      { title: "Choose the protected PDF", description: "Upload a file you own or may modify." },
      {
        title: "Enter its password",
        description: "Provide the document’s current opening password.",
      },
      { title: "Unlock the copy", description: "SwiftPDF removes protection after validation." },
      { title: "Download carefully", description: "Store the unprotected PDF in a safe location." },
    ],
    why: "Unlocking removes repeated password prompts and allows an authorized document to work with editing, conversion, or archival systems that cannot accept encryption.",
    whyPoints: [
      "Access your own archived files",
      "Prepare a PDF for conversion",
      "Remove repeated password prompts",
      "Create an approved unprotected copy",
    ],
    faqs: [
      {
        q: "Can SwiftPDF unlock a PDF without its password?",
        a: "No. You must know the current password and have authorization to remove the document’s protection.",
      },
      {
        q: "What happens when the password is incorrect?",
        a: "The tool reports an error and does not create an unlocked output file.",
      },
      {
        q: "Is the original protected PDF changed?",
        a: "No. SwiftPDF creates a separate unlocked copy and leaves the source file as it was.",
      },
      {
        q: "Is an unlocked PDF safe to share?",
        a: "It no longer has the same access barrier. Consider where it is stored and who can receive it before sharing.",
      },
      {
        q: "Can I protect the file again later?",
        a: "Yes. Use Protect PDF to apply a new password to the unlocked or edited document.",
      },
    ],
    related: ["protect-pdf", "pdf-to-word", "compress-pdf", "sign-pdf"],
  },
  "sign-pdf": {
    heading: "Add a Signature to Your PDF Online",
    intro: [
      "Sign PDF lets you place a typed, drawn, or uploaded signature onto a document without printing and rescanning it. The visual workspace supports positioning and resizing so the signature can fit naturally into forms, agreements, approvals, and acknowledgement pages.",
      "After uploading the PDF, create a signature or use an existing image, choose the required page, and place it over the document preview. SwiftPDF embeds the signature into a new PDF copy. Review names, dates, and placement carefully before sending a signed document.",
    ],
    note: "Use a signature image with clean edges and enough contrast against the page. On formal documents, keep the mark inside the designated signature area and verify that it does not cover dates, names, checkboxes, or nearby instructions.",
    steps: [
      { title: "Upload the document", description: "Open the PDF that needs your signature." },
      { title: "Create a signature", description: "Draw, type, or upload a signature image." },
      { title: "Place and resize", description: "Position it accurately on the chosen page." },
      { title: "Sign and download", description: "Create the completed PDF copy." },
    ],
    why: "Online signing removes the print-scan cycle and makes routine approvals faster while preserving the document as a convenient PDF.",
    whyPoints: [
      "Sign forms from any device",
      "Place signatures precisely",
      "Use transparent PNG signatures",
      "Complete remote document workflows",
    ],
    faqs: [
      {
        q: "Can I draw my signature?",
        a: "Yes. Use the drawing pad to create a handwritten signature directly in the browser.",
      },
      {
        q: "Can I upload a signature image?",
        a: "Yes. Supported PNG and JPG images can be placed on the PDF, and PNG transparency is preserved.",
      },
      {
        q: "Can signatures be added to different pages?",
        a: "Yes. Choose pages and position signature elements where they are required in the document.",
      },
      {
        q: "Is this the same as a digital certificate signature?",
        a: "No. This tool places a visible signature image; it does not create a certificate-based cryptographic signature.",
      },
      {
        q: "What should I review before downloading?",
        a: "Check the selected page, signature size, placement, document details, and any dates or initials required by the recipient.",
      },
    ],
    related: ["protect-pdf", "unlock-pdf", "add-page-numbers", "watermark-pdf"],
  },
};

export function getToolSeoContent(slug: string) {
  return toolSeoContent[slug];
}

export function getToolSeoContentByPath(path: string) {
  const slug = path.replace(/^\//, "");

  if (slug === "extract-pdf-pages") return toolSeoContent["extract-pages"];
  if (slug === "delete-pdf-pages") return toolSeoContent["delete-pages"];
  if (slug === "reorder-pdf-pages") return toolSeoContent["reorder-pdf"];

  return toolSeoContent[slug];
}
