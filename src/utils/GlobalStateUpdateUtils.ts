import { store } from "../store";
import { updateProjectStats } from "../store/slices/ProjectSlice";
import { updateTaskStats } from "../store/slices/TaskSlice";

// 1. Define strict types for what we are updating
type EntityType = "MESSAGE" | "TASK" | "MEMBER" | "TASK_COMPLETE";
type ActionType = 'CREATE' | 'DELETE';

interface UpdateProjectStatsProps {
  entity: EntityType;
  action: ActionType;
  // projectId?: string; // Add this if you need to update a specific project in an array
}

// 2. Create the unified helper method
export const onUpdateGlobalStateForProject = async ({
  entity,
  action,
}: UpdateProjectStatsProps) => {
  try {
    // If creating, add 1. If deleting, subtract 1.
    const countChange = action === 'CREATE' ? 1 : -1;


    switch (entity) {
      case 'MESSAGE':
        store.dispatch(updateProjectStats({ entity: "MESSAGE", change : countChange }));
        break;
      case 'TASK':
        store.dispatch(
          updateProjectStats({ entity: "TASK", change: countChange }),
        );
        break;
      case 'MEMBER':
        store.dispatch(
          updateProjectStats({ entity: "MEMBER", change: countChange }),
        );
        break;
      case 'TASK_COMPLETE':
        store.dispatch(
          updateProjectStats({ entity: "TASK_COMPLETE", change: countChange }),
        );
        break;
      default:
        console.warn('Unknown entity type provided to onUpdateGlobalStateForProject');
    }
  } catch (error) {
    console.error(`Failed to update project stats for ${entity}`, error);
  }
};


// 1. Add both COMMENT and MESSAGE to the allowed types
export type TaskEntityType = 'COMMENT' | 'MESSAGE'; 

export interface UpdateTaskStatsProps {
  entity: TaskEntityType;
  action: ActionType;
  // taskId?: string; // Add this if you need to update a specific task in a list
}

// 2. The cleaner Task helper function
export const onUpdateGlobalStateForTask = async ({
  entity,
  action,
}: UpdateTaskStatsProps) => {
  try {
    const countChange = action === 'CREATE' ? 1 : -1;

    // Passes either 'COMMENT' or 'MESSAGE' directly to the Redux slice
    store.dispatch(updateTaskStats({ entity, change: countChange }));
  } catch (error) {
    console.error(`Failed to update task stats for ${entity}`, error);
  }
};