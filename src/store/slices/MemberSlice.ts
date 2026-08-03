import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { apiClient } from "../../api/client";
import { API_ENDPOINTS, fetchStatusType } from "../../api/endpoint";
import { MemberProps, ProjectProps } from "./types";
import { formatMemberResponse, formatSingleMember } from "../TypeFormatter";

type MemberState = {
  members: MemberProps[];

  loading: boolean;

  error: string | null;

  success: boolean;
};

const initialState: MemberState = {
  members: [],
  loading: false,

  error: null,

  success: false,
};

/* ================= THUNKS ================= */

export const addMember = createAsyncThunk(
  "member/add",
  async (
    data: { projectId: string; memberEmail: string; role?: string },
    thunkAPI,
  ) => {
    try {

      const res = await apiClient.post(API_ENDPOINTS.ADD_MEMBER, data);

      return res.data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err?.response?.data?.message || "Add failed",
      );
    }
  },
);

export const fetchMembers = createAsyncThunk(
  "member/fetch",
  async (
    {
      projectId,
      limit,
      skip,
    }: { projectId: string; limit?: number; skip?: number },
    thunkAPI,
  ) => {
    try {
      const res = await apiClient.get(
        API_ENDPOINTS.FETCH_MEMBERS(projectId, limit, skip),
      );

      return res.data.members;
    } catch (err: any) {
      return thunkAPI.rejectWithValue("Fetch failed");
    }
  },
);

export const updateMemberRole = createAsyncThunk(
  "member/updateRole",
  async (
    data: { projectId: string; memberId: string; role: string },
    thunkAPI,
  ) => {
    try {
      const res = await apiClient.patch(API_ENDPOINTS.UPDATE_MEMBER_ROLE, data);
      return res.data.updatedMember;
    } catch (err: any) {
      return thunkAPI.rejectWithValue("Update failed");
    }
  },
);

export const removeMember = createAsyncThunk(
  "member/remove",
  async (
    { projectId, memberId }: { projectId: string; memberId: string },
    thunkAPI,
  ) => {
    try {
      const res = await apiClient.delete(
        API_ENDPOINTS.REMOVE_MEMBER(memberId, projectId),
      );
      return res.data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue("Remove failed");
    }
  },
);

export const leaveProject = createAsyncThunk(
  "member/leave",
  async (projectId: string, thunkAPI) => {
    try {
      const res = await apiClient.delete(
        API_ENDPOINTS.LEAVE_PROJECT(projectId),
      );
      return res.data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue("Leave failed");
    }
  },
);

/* ================= SLICE ================= */

const memberSlice = createSlice({
  name: "member",
  initialState,
  reducers: {
    resetMembers: (state) => {
      state.error = initialState.error;
      state.loading = initialState.loading;
      state.members = initialState.members;
      state.success = initialState.success;
    },

    clearMemberStatus: (state) => {
      state.error = null;
      state.success = false;
      state.loading = false;
    },
    clearMemberError: (state) => {
      state.error = initialState.error;
    },
  },

  extraReducers: (builder) => {
    builder

      /* ===== FETCH ===== */
      .addCase(fetchMembers.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(fetchMembers.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;

        state.members = formatMemberResponse(action.payload); // ✅ FIXED
      })
      .addCase(fetchMembers.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })

      /* ===== ADD ===== */
      .addCase(addMember.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(addMember.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;

        state.members.push(formatSingleMember(action.payload.member));
      })
      .addCase(addMember.rejected, (state, action: any) => {

        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })

      /* ===== UPDATE ROLE ===== */
      .addCase(updateMemberRole.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateMemberRole.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;

        const updated = formatSingleMember(action.payload);

        state.members = state.members.map((m) =>
          m.assignedMemberId === updated.assignedMemberId
            ? { ...m, role: updated.role }
            : m,
        );
      })
      .addCase(updateMemberRole.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })

      /* ===== REMOVE ===== */
      .addCase(removeMember.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(removeMember.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;

        const removed = action.payload.removedMember;
        if (!removed) return;

        state.members = state.members.filter(
          (m) => m.memberId !== removed.memberId,
        );
      })
      .addCase(removeMember.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })

      /* ===== LEAVE ===== */
      .addCase(leaveProject.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(leaveProject.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;

        const left = formatSingleMember(action.payload.leavedProject);
        if (!left) return;

        state.members = [];
      })
      .addCase(leaveProject.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      });
  },
});

export const { resetMembers, clearMemberStatus, clearMemberError } =
  memberSlice.actions;
export default memberSlice.reducer;
