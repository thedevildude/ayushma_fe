"use client";

import ProjectForm from "@/components/forms/projectform";
import Modal from "@/components/modal";
import { Button } from "@/components/ui/interactive";
import { Document, Project } from "@/types/project";
import { API } from "@/utils/api";
import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Page({ params }: { params: { project_id: string } }) {
  const { project_id } = params;
  const projectsQuery = useQuery(["project", project_id], () =>
    API.projects.get(project_id),
  );
  const project: Project | undefined = projectsQuery.data || undefined;
  const documentsQuery = useQuery(["project", project_id, "documents"], () =>
    API.projects.documents.list(project_id),
  );
  const documents: Document[] | undefined = documentsQuery.data?.results;
  const [showDeleteModal, setShowDeleteModel] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showSetDefaultModal, setShowSetDefaultModal] = useState(false);

  const router = useRouter();

  const docIconsClassNames = {
    1: "file-text-o",
    2: "link",
    3: "font",
  };

  const updateProjectMutation = useMutation(
    (project: Partial<Project>) => API.projects.update(project_id, project),
    {
      onSuccess: () => {
        projectsQuery.refetch();
      },
    },
  );

  const deleteProjectMutation = useMutation(
    () => API.projects.delete(project_id),
    {
      onSuccess: () => {
        router.push("/admin");
      },
    },
  );

  const setAsDefautMutation = useMutation(
    () =>
      API.projects.update(project_id, {
        is_default: true,
      }),
    {
      onSuccess: () => {
        projectsQuery.refetch();
      },
    },
  );

  const archiveProjectMutation = useMutation(
    () =>
      API.projects.update(project_id, {
        archived: !project?.archived,
      }),
    {
      onSuccess: () => {
        projectsQuery.refetch();
      },
    },
  );

  const handleProjectSave = async (project: Partial<Project>) => {
    await updateProjectMutation.mutateAsync(project);
  };

  const handleDelete = async () => {
    await deleteProjectMutation.mutateAsync();
  };

  const handleArchive = async () => {
    await archiveProjectMutation.mutateAsync();
  };

  const handleSetAsDefault = async () => {
    await setAsDefautMutation.mutateAsync();
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex gap-2 items-center">
          <h1 className="text-3xl font-black">{project?.title}</h1>
          {project?.is_default && (
            <span className="text-xs ml-2 bg-gray-200 text-gray-500 px-2 py-1 rounded-full">
              Default
            </span>
          )}
        </div>
        <div className="flex justify-center items-center">
          <Link
            href={`/admin/projects/${project_id}/chats`}
            className="bg-slate-200 flex items-center gap-2 justify-center hover:bg-slate-300 m-2 p-2 rounded-xl px-6"
          >
            <i className="fa fa-comments"></i>
            Chats
          </Link>
        </div>
      </div>
      <h2 className="text-2xl mt-6 font-bold mb-4">Documents</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-8">
        {documents?.map((document, i) => (
          <Link
            href={
              document.uploading
                ? `/admin/projects/${project_id}`
                : `/admin/projects/${project_id}/documents/${document.external_id}`
            }
            key={i}
            className="border border-gray-300 hover:bg-gray-100 bg-white rounded-lg p-4 flex items-center gap-2 justify-between"
          >
            <div className="flex items-center gap-2">
              <i
                className={`text-gray-800 fa fa-${
                  docIconsClassNames[document.document_type]
                }`}
              />
              {document.title}
            </div>
            {document.uploading && (
              <div className="text-xs text-gray-600 inline-flex items-center gap-2">
                <i className="fa fa-spinner-third fa-spin"></i>
                Uploading...
              </div>
            )}
          </Link>
        ))}
        {!project?.archived && (
          <Link
            href={`/admin/projects/${project_id}/documents/new`}
            className="border border-dashed border-gray-300 hover:bg-gray-100 bg-white rounded-lg p-4"
          >
            <i className="far fa-plus" /> New Document
          </Link>
        )}
        {project?.archived && documents?.length === 0 && "No documents"}
      </div>
      <h2 className="text-2xl mt-6 font-bold mb-4">Details</h2>
      {project && (
        <ProjectForm
          project={project}
          onSubmit={handleProjectSave}
          loading={updateProjectMutation.isLoading}
          errors={updateProjectMutation.error}
        />
      )}
      <div className="flex gap-2 mt-4 items-center justify-stretch">
        <Button
          className="w-full"
          variant="danger"
          onClick={() => setShowDeleteModel(true)}
        >
          <i className="fa-regular fa-trash mr-2"></i>
          Delete Project
        </Button>
        <Button
          className="w-full bg-blue-500 enabled:hover:bg-blue-600"
          onClick={() => setShowArchiveModal(true)}
        >
          <i className="fa-regular fa-box-archive mr-2"></i>{" "}
          {project?.archived ? "Unarchive" : "Archive"} Project
        </Button>
        <Button
          variant="secondary"
          className="w-full bg-slate-200 enabled:hover:bg-slate-300"
          onClick={() => setShowSetDefaultModal(true)}
          disabled={project?.is_default}
        >
          Set as default project
        </Button>
      </div>
      <Modal
        onClose={() => setShowDeleteModel(false)}
        show={showDeleteModal}
        className="w-[500px]"
      >
        <div className="flex flex-col gap-2">
          <p>Are you sure you want to delete this project?</p>
          <div className="flex flex-col md:flex-row gap-2 justify-end">
            <button
              className="bg-gray-300 hover:bg-gray-400 px-4 p-2 rounded-lg"
              onClick={() => setShowDeleteModel(false)}
            >
              Cancel
            </button>
            <button
              className="bg-red-500 hover:bg-red-700 px-4 text-white p-2 rounded-lg"
              onClick={() => {
                handleDelete();
                setShowDeleteModel(false);
              }}
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
      <Modal
        onClose={() => setShowArchiveModal(false)}
        show={showArchiveModal}
        className="w-[500px]"
      >
        <div className="flex flex-col gap-2">
          <p>
            Are you sure you want to{" "}
            {project?.archived ? "unarchive" : "archive"} this project?
          </p>
          <div className="flex flex-col md:flex-row gap-2 justify-end">
            <button
              className="bg-gray-300 hover:bg-gray-400 px-4 p-2 rounded-lg"
              onClick={() => setShowArchiveModal(false)}
            >
              Cancel
            </button>
            <button
              className="bg-blue-500 hover:bg-blue-700 px-4 text-white p-2 rounded-lg"
              onClick={() => {
                handleArchive();
                setShowArchiveModal(false);
              }}
            >
              {project?.archived ? "Unarchive" : "Archive"}
            </button>
          </div>
        </div>
      </Modal>
      <Modal
        onClose={() => setShowSetDefaultModal(false)}
        show={showSetDefaultModal}
        className="w-[500px]"
      >
        <div className="flex flex-col gap-2">
          <p>Are you sure you want to set this project as default?</p>
          <div className="flex flex-col md:flex-row gap-2 justify-end">
            <button
              className="bg-gray-300 hover:bg-gray-400 px-4 p-2 rounded-lg"
              onClick={() => setShowSetDefaultModal(false)}
            >
              Cancel
            </button>
            <button
              className="bg-blue-500 hover:bg-blue-700 px-4 text-white p-2 rounded-lg"
              onClick={() => {
                handleSetAsDefault();
                setShowSetDefaultModal(false);
              }}
            >
              Confirm
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
