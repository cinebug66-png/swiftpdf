const CLOUDCONVERT_API_BASE = "https://api.cloudconvert.com/v2";

type CloudConvertOperation =
  | "import/upload"
  | "convert"
  | "optimize"
  | "export/url";

type CloudConvertTaskDefinition = {
  operation: CloudConvertOperation;
  input?: string | string[];
  input_format?: string;
  output_format?: string;
  filename?: string;
  profile?: "web" | "print" | "archive" | "mrc" | "max";
};

type CloudConvertJobRequest = {
  tasks: Record<string, CloudConvertTaskDefinition>;
  tag?: string;
};

type CloudConvertUploadForm = {
  url: string;
  parameters: Record<string, string | number | boolean>;
};

export type CloudConvertResultFile = {
  filename: string;
  url?: string;
};

export type CloudConvertTask = {
  id: string;
  name: string;
  operation: string;
  status: "waiting" | "processing" | "finished" | "error";
  message?: string | null;
  code?: string | null;
  result?: {
    form?: CloudConvertUploadForm;
    files?: CloudConvertResultFile[];
  } | null;
};

export type CloudConvertJob = {
  id: string;
  status: "waiting" | "processing" | "finished" | "error";
  tasks: CloudConvertTask[];
};

export type CloudConvertOutput = {
  blob: Blob;
  filename: string;
  downloadUrl: string;
  job: CloudConvertJob;
  originalSize: number;
  outputSize: number;
};

function getApiKey() {
  const apiKey = import.meta.env.VITE_CLOUDCONVERT_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing VITE_CLOUDCONVERT_API_KEY in .env.local. Add it and restart the dev server.",
    );
  }

  return apiKey;
}

async function cloudConvertRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${CLOUDCONVERT_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...init?.headers,
    },
  });

  const json = (await response.json().catch(() => null)) as
    | { data?: T; message?: string }
    | null;

  if (!response.ok || !json?.data) {
    throw new Error(json?.message || `CloudConvert request failed with ${response.status}.`);
  }

  return json.data;
}

async function createJob(payload: CloudConvertJobRequest) {
  return cloudConvertRequest<CloudConvertJob>("/jobs", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

async function getJob(jobId: string) {
  return cloudConvertRequest<CloudConvertJob>(`/jobs/${jobId}`, {
    method: "GET",
  });
}

function findTask(job: CloudConvertJob, taskName: string) {
  const task = job.tasks.find((item) => item.name === taskName);
  if (!task) {
    throw new Error(`CloudConvert task "${taskName}" was not found.`);
  }

  return task;
}

async function uploadFileToTask(task: CloudConvertTask, file: File) {
  const form = task.result?.form;
  if (!form) {
    throw new Error("CloudConvert upload form is missing.");
  }

  const formData = new FormData();

  Object.entries(form.parameters).forEach(([key, value]) => {
    formData.append(key, String(value));
  });

  formData.append("file", file);

  const response = await fetch(form.url, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Uploading the file to CloudConvert failed.");
  }
}

function getExportFile(job: CloudConvertJob) {
  const exportTask = findTask(job, "export-file");
  const file = exportTask.result?.files?.[0];

  if (!file?.url) {
    throw new Error("CloudConvert did not return a download URL.");
  }

  return file;
}

async function waitForJob(jobId: string, onUpdate?: (job: CloudConvertJob) => void) {
  let currentJob = await getJob(jobId);
  onUpdate?.(currentJob);

  while (currentJob.status === "waiting" || currentJob.status === "processing") {
    await new Promise((resolve) => window.setTimeout(resolve, 1500));
    currentJob = await getJob(jobId);
    onUpdate?.(currentJob);
  }

  if (currentJob.status === "error") {
    const failedTask = currentJob.tasks.find((task) => task.status === "error");
    throw new Error(
      failedTask?.message || "CloudConvert could not complete the job. Please try again.",
    );
  }

  return currentJob;
}

async function downloadOutputFile(file: CloudConvertResultFile) {
  if (!file.url) {
    throw new Error("Download URL is missing.");
  }

  const response = await fetch(file.url);
  if (!response.ok) {
    throw new Error("Downloading the converted file failed.");
  }

  return response.blob();
}

function replaceExtension(filename: string, nextExtension: string) {
  return filename.replace(/\.[^.]+$/, "") + nextExtension;
}

function createDownloadUrl(blob: Blob) {
  return URL.createObjectURL(blob);
}

export function revokeDownloadUrl(url: string | null) {
  if (url) {
    URL.revokeObjectURL(url);
  }
}

export async function convertPdfToWord(
  file: File,
  onUpdate?: (job: CloudConvertJob) => void,
): Promise<CloudConvertOutput> {
  const outputFilename = replaceExtension(file.name, ".docx");

  const job = await createJob({
    tag: "swiftpdf-pdf-to-word",
    tasks: {
      "upload-file": {
        operation: "import/upload",
      },
      "convert-file": {
        operation: "convert",
        input: "upload-file",
        input_format: "pdf",
        output_format: "docx",
        filename: outputFilename,
      },
      "export-file": {
        operation: "export/url",
        input: "convert-file",
      },
    },
  });

  await uploadFileToTask(findTask(job, "upload-file"), file);
  const finishedJob = await waitForJob(job.id, onUpdate);
  const exportFile = getExportFile(finishedJob);
  const blob = await downloadOutputFile(exportFile);

  return {
    blob,
    filename: exportFile.filename || outputFilename,
    downloadUrl: createDownloadUrl(blob),
    job: finishedJob,
    originalSize: file.size,
    outputSize: blob.size,
  };
}

export async function compressPdf(
  file: File,
  onUpdate?: (job: CloudConvertJob) => void,
): Promise<CloudConvertOutput> {
  const outputFilename = replaceExtension(file.name, "-compressed.pdf");

  const job = await createJob({
    tag: "swiftpdf-compress-pdf",
    tasks: {
      "upload-file": {
        operation: "import/upload",
      },
      "optimize-file": {
        operation: "optimize",
        input: "upload-file",
        input_format: "pdf",
        profile: "web",
        filename: outputFilename,
      },
      "export-file": {
        operation: "export/url",
        input: "optimize-file",
      },
    },
  });

  await uploadFileToTask(findTask(job, "upload-file"), file);
  const finishedJob = await waitForJob(job.id, onUpdate);
  const exportFile = getExportFile(finishedJob);
  const blob = await downloadOutputFile(exportFile);

  return {
    blob,
    filename: exportFile.filename || outputFilename,
    downloadUrl: createDownloadUrl(blob),
    job: finishedJob,
    originalSize: file.size,
    outputSize: blob.size,
  };
}
