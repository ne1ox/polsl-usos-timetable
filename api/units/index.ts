import type { ActivityDTO, GroupSelection, LoadOptions } from "../types";
import type { Transport } from "../usosFetch";

export function getGroupMeetings(transport: Transport, group: GroupSelection, ttlMs: number, options: LoadOptions) {
  return transport.get<ActivityDTO[]>("tt/classgroup_dates2", {
    unit_id: group.unitId,
    group_number: String(group.groupNumber),
    // name is included because the deployed USOS may require it even with explicit fields.
    fields: "name|type|start_time|end_time|course_id|course_name|unit_id|group_number|classtype_name|building_name|building_id|room_number|room_id|lecturer_ids|frequency|url|sm_id|cgwm_id",
  }, ttlMs, options);
}
