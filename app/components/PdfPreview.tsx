"use client";

interface Props {
  url: string;
}

export default function PdfPreview({ url }: Props) {
  return (
    <div>
      <div className="mb-2.5">
        <a
          href={url}
          download="tailored-cv.pdf"
          className="inline-block px-5 py-2 text-sm font-semibold text-white bg-green-600 rounded-md no-underline hover:bg-green-700"
        >
          Download PDF
        </a>
      </div>
      <iframe
        src={url}
        className="w-full h-[700px] border border-gray-200 rounded-md"
        title="CV Preview"
      />
    </div>
  );
}
