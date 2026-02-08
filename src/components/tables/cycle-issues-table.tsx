"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import type { LinearIssue } from "@/lib/linear/types";
import { cn } from "@/lib/utils";

type SortField =
  | "identifier"
  | "title"
  | "assignee"
  | "state"
  | "priority"
  | "estimate"
  | "createdAt";
type SortDirection = "asc" | "desc";

interface CycleIssuesTableProps {
  issues: LinearIssue[];
}

const PRIORITY_LABELS: Record<number, { label: string; className: string }> = {
  1: { label: "Urgent", className: "bg-rose-500/10 text-rose-500 border-rose-500/20" },
  2: { label: "High", className: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
  3: { label: "Normal", className: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  4: { label: "Low", className: "bg-muted text-muted-foreground border-border" },
  0: { label: "None", className: "bg-muted text-muted-foreground border-border" },
};

function SortButton({
  field,
  currentField,
  direction,
  onSort,
  children,
}: {
  field: SortField;
  currentField: SortField;
  direction: SortDirection;
  onSort: (field: SortField) => void;
  children: React.ReactNode;
}) {
  const isActive = field === currentField;
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 text-xs font-medium"
      onClick={() => onSort(field)}
    >
      {children}
      {isActive ? (
        direction === "asc" ? (
          <ArrowUp className="ml-1 h-3 w-3" />
        ) : (
          <ArrowDown className="ml-1 h-3 w-3" />
        )
      ) : (
        <ArrowUpDown className="ml-1 h-3 w-3 opacity-30" />
      )}
    </Button>
  );
}

export function CycleIssuesTable({ issues }: CycleIssuesTableProps) {
  const [sortField, setSortField] = useState<SortField>("priority");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const handleSort = useCallback(
    (field: SortField) => {
      if (field === sortField) {
        setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field);
        setSortDirection("asc");
      }
    },
    [sortField]
  );

  const statuses = useMemo(() => {
    const set = new Set<string>();
    for (const issue of issues) {
      set.add(issue.state.name);
    }
    return Array.from(set);
  }, [issues]);

  const filteredAndSorted = useMemo(() => {
    let result = issues;

    if (statusFilter !== "all") {
      result = result.filter((i) => i.state.name === statusFilter);
    }

    return [...result].sort((a, b) => {
      const dir = sortDirection === "asc" ? 1 : -1;

      switch (sortField) {
        case "identifier":
          return dir * a.identifier.localeCompare(b.identifier);
        case "title":
          return dir * a.title.localeCompare(b.title);
        case "assignee":
          return (
            dir *
            (a.assignee?.name ?? "").localeCompare(b.assignee?.name ?? "")
          );
        case "state":
          return dir * (a.state.position - b.state.position);
        case "priority":
          return dir * (a.priority - b.priority);
        case "estimate":
          return dir * ((a.estimate ?? 0) - (b.estimate ?? 0));
        case "createdAt":
          return (
            dir *
            (new Date(a.createdAt).getTime() -
              new Date(b.createdAt).getTime())
          );
        default:
          return 0;
      }
    });
  }, [issues, statusFilter, sortField, sortDirection]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-40 text-xs">
            <SelectValue placeholder="ステータス" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">
              すべて
            </SelectItem>
            {statuses.map((s) => (
              <SelectItem key={s} value={s} className="text-xs">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">
          {filteredAndSorted.length} 件
        </span>
      </div>

      <div className="rounded-md border overflow-auto max-h-96 scrollbar-thin">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-24">
                <SortButton
                  field="identifier"
                  currentField={sortField}
                  direction={sortDirection}
                  onSort={handleSort}
                >
                  ID
                </SortButton>
              </TableHead>
              <TableHead>
                <SortButton
                  field="title"
                  currentField={sortField}
                  direction={sortDirection}
                  onSort={handleSort}
                >
                  タイトル
                </SortButton>
              </TableHead>
              <TableHead className="w-36">
                <SortButton
                  field="assignee"
                  currentField={sortField}
                  direction={sortDirection}
                  onSort={handleSort}
                >
                  担当者
                </SortButton>
              </TableHead>
              <TableHead className="w-28">
                <SortButton
                  field="state"
                  currentField={sortField}
                  direction={sortDirection}
                  onSort={handleSort}
                >
                  ステータス
                </SortButton>
              </TableHead>
              <TableHead className="w-24">
                <SortButton
                  field="priority"
                  currentField={sortField}
                  direction={sortDirection}
                  onSort={handleSort}
                >
                  優先度
                </SortButton>
              </TableHead>
              <TableHead className="w-20 text-right">
                <SortButton
                  field="estimate"
                  currentField={sortField}
                  direction={sortDirection}
                  onSort={handleSort}
                >
                  見積
                </SortButton>
              </TableHead>
              <TableHead className="w-24">
                <SortButton
                  field="createdAt"
                  currentField={sortField}
                  direction={sortDirection}
                  onSort={handleSort}
                >
                  作成日
                </SortButton>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSorted.map((issue) => {
              const priorityInfo = PRIORITY_LABELS[issue.priority] ?? PRIORITY_LABELS[0];
              return (
                <TableRow key={issue.id} className="group">
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    <a
                      href={issue.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-foreground hover:underline"
                    >
                      {issue.identifier}
                    </a>
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-sm">
                    {issue.title}
                  </TableCell>
                  <TableCell>
                    {issue.assignee ? (
                      <div className="flex items-center gap-1.5">
                        <Avatar className="h-5 w-5">
                          <AvatarImage
                            src={issue.assignee.avatarUrl ?? undefined}
                          />
                          <AvatarFallback className="text-[8px]">
                            {issue.assignee.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs truncate">
                          {issue.assignee.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: issue.state.color }}
                      />
                      <span className="text-xs">{issue.state.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn("text-[10px] px-1.5", priorityInfo.className)}
                    >
                      {priorityInfo.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-xs font-mono">
                    {issue.estimate ?? "-"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(issue.createdAt)}
                  </TableCell>
                </TableRow>
              );
            })}
            {filteredAndSorted.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-sm text-muted-foreground py-8"
                >
                  該当するイシューがありません
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
