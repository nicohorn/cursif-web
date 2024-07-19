import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/loader';
import { Notify } from '@config/notiflix-config';
import { useMutation, gql } from '@apollo/client';
import { useAuth } from '@/components/auth-provider';
import { Modal, openModal, closeModal } from '@/components/modal';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import DeleteNotebookForm from '@/components/notebooks/delete';

const CREATE_NOTEBOOK_MUTATION = gql`
  mutation CreateNotebook($title: String!, $description: String, $ownerId: ID!) {
    createNotebook(title: $title, description: $description, ownerId: $ownerId) {
      id
      title
      description
    }
  }
`;

const UPDATE_NOTEBOOK_MUTATION = gql`
  mutation UpdateNotebook($title: String!, $id: ID!, $description: String, $ownerId: ID!) {
    updateNotebook(title: $title, id: $id, description: $description, ownerId: $ownerId) {
      id
      title
      description
    }
  }
`;

const ADD_COLLABORATOR = gql`
  mutation AddCollaborator($notebookId: ID!, $userId: ID, $email: String!) {
    addCollaborator(notebookId: $notebookId, userId: $userId, email: $email) {
      id
    }
  }
`;

const DELETE_COLLABORATOR = gql`
  mutation DeleteCollaborator($notebookId: ID!, $userId: ID!) {
    deleteCollaborator(notebookId: $notebookId, userId: $userId) {
      id
    }
  }
`;


export default function NotebookForm({ notebook, onComplete }: { notebook?: Notebook, onComplete?: VoidFunction }) {
  const router = useRouter();
  const { user } = useAuth();

  const [title, setTitle] = useState(notebook?.title);
  const [description, setDescription] = useState(notebook?.description);

  const [collaboratorId, setCollaboratorId] = useState('');

  const [createNotebook, { loading: createLoading }] = useMutation(CREATE_NOTEBOOK_MUTATION, {
    variables: {
      ownerId: user?.id,
      ownerType: "user",
    },
    onCompleted: (data) => {
      if (onComplete)
        onComplete();

      Notify.success("Notebook created!");
      router.push(`/notebooks/${data.createNotebook.id}`);
    },
    onError: (error) => {
      Notify.failure(`${error.message}!`);
    },
  });

  const [updateNotebook, { loading: updateLoading }] = useMutation(UPDATE_NOTEBOOK_MUTATION, {
    variables: {
      id: notebook?.id,
      ownerId: user?.id,
      ownerType: "user",
    },
    onCompleted: (data) => {
      if (onComplete)
        onComplete();

      Notify.success("Notebook updated!");
      router.push(`/notebooks/${data.updateNotebook.id}`);
    },
    onError: (error) => {
      Notify.failure(`${error.message}!`);
    },
  });

  const [addCollaborator] = useMutation(ADD_COLLABORATOR, {
    onCompleted: () => {
      if (onComplete)
        onComplete();

      Notify.success("Collaborator added!");
      router.push(`/notebooks/${notebook?.id}`);
    },
    onError: (error) => {
      Notify.failure(`${error.message}!`);
    },
  });

  const [deleteCollaborator] = useMutation(DELETE_COLLABORATOR, {
    onCompleted: () => {
      if (onComplete)
        onComplete();

      Notify.success("Collaborator removed!");
      router.push(`/notebooks/${notebook?.id}`);
    },
    onError: (error) => {
      Notify.failure(`${error.message}!`);
    },
  });

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (notebook) {
      updateNotebook({ variables: { title, description } });
    } else {
      createNotebook({ variables: { title, description } });
    }
  };

  const onAddCollaborator = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (collaboratorId.includes('@')) {
      addCollaborator({ variables: { notebookId: notebook?.id, email: collaboratorId } });
    } else {
      addCollaborator({ variables: { notebookId: notebook?.id, userId: collaboratorId } });
    }
  }

  if (createLoading || updateLoading)
    return (
      <div className="flex items-center justify-center h-full min-h-[150px]">
        <Spinner size="35px" />
      </div>
    );

  return (
    <div className="p-4 md:p-5 ">
      {notebook && (
        <div className="font-bold my-2">General</div>
      )}
      <form onSubmit={onSubmit} className="space-y-4">
        <input
          className="input w-full"
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required={true}
        />
        <textarea
          rows={4}
          maxLength={200}
          className="input w-full resize-none"
          placeholder="Write your notebook description here... (Optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required={false}
        />
        <div className="flex justify-end">
          <button type="submit" className="button bg-new">
            <span className="label">{notebook ? 'Save' : 'Create'}</span>
          </button>
        </div>
      </form>
      {notebook && (
        <>
          <hr className="my-4" />
          <div className="p-2">
            <div className="flex items-center mb-2">
              Invite Collaborator
            </div>
            <div>
              <form onSubmit={onAddCollaborator} className="flex space-x-4">
                <input
                  className="input flex-grow"
                  type="text"
                  placeholder="Collaborator ID..."
                  onChange={(e) => setCollaboratorId(e.target.value)}
                  required
                />
                <button type="submit" className="button bg-new">
                  <span className="label">Invite</span>
                </button>
              </form>
            </div>
            <div className="mt-2">
              <p>Notebook Collaborators</p>
              <div className="border rounded-lg p-2 m-1">
                {notebook?.collaborators?.map((collaborator) => (
                  <div key={collaborator.id} className="flex items-center mb-2">
                    <p className="flex-grow">{collaborator.username}</p>
                    <button className="button bg-delete" onClick={() => deleteCollaborator({ variables: { notebookId: notebook?.id, userId: collaborator.id } })}>
                      <span className="label">Delete</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
      {notebook && (
        <>
          <hr className="my-4" />
          <div className='flex items-center font-bold my-2'>
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-1" /> Danger Zone
          </div>
          <div className="flex items-center border rounded-lg border-red-600 rounded-4 p-2">
            <div>
              <p className="font-bold">Delete this notebook.</p>
              <p>This action is irreversible. All pages in this notebook will be deleted.</p>
            </div>
            <span>
              <button className='button bg-delete' onClick={() => openModal('delete-notebook-modal')}>
                Delete
              </button>
            </span>
          </div>
          <Modal id='delete-notebook-modal' title='Delete Notebook'>
            <DeleteNotebookForm notebook={notebook} onComplete={() => { closeModal('delete-notebook-modal'); }} onUpdate={() => router.push(`/notebooks`)} />
          </Modal>
        </>
      )}
    </div>
  );
}
