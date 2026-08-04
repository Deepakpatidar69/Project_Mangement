import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { apiClient } from "../../api/client";
import { API_ENDPOINTS } from "../../api/endpoint";
import { MemberProps } from "./types";
import { formatMemberResponse, formatSingleMember } from "../TypeFormatter";

type MemberState = {
  members: MemberProps[];
  totalMembersCount : number;
  loading: boolean;
  error: string | null;
  success: boolean;
};

const initialState: MemberState = {
  members: [],
  totalMembersCount : 0,
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

      return res.data;
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

/* ================= SLICE ================= */

const memberSlice = createSlice({
  name: "member",
  initialState,
  reducers: {
    resetMembers: (state) => {
      state.error = initialState.error;
      state.loading = initialState.loading;
      state.members = initialState.members;
      state.totalMembersCount = initialState.totalMembersCount;
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

        const { members = [], totalMembersCount = 0 } = action.payload;
        const formattedMembers = formatMemberResponse(members);

        // Check the 'skip' value passed from the frontend dispatch
        const skip = action.meta.arg.skip || 0;

        if (skip === 0) {
          // INITIAL LOAD OR REFRESH: Replace the entire array
          state.members = formattedMembers;
        } else {
          // LOAD MORE: Append new members securely (preventing duplicate IDs)
          const existingIds = new Set(state.members.map((m) => m.memberId));
          const uniqueNewMembers = formattedMembers.filter(
            (m: any) => !existingIds.has(m.memberId),
          );

          state.members = [...state.members, ...uniqueNewMembers];
        }

        state.totalMembersCount = totalMembersCount;
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
        state.totalMembersCount += 1;
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

        state.totalMembersCount -= 1;
        state.members = state.members.filter(
          (m) => m.memberId !== removed.memberId,
        );
      })
      .addCase(removeMember.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      });

  },
});

export const { resetMembers, clearMemberStatus, clearMemberError } =
  memberSlice.actions;
export default memberSlice.reducer;
