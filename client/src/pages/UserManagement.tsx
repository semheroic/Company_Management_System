import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { 
  Plus, Users, Edit, Trash2, 
  Building2, Key, Loader2, ShieldCheck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { API_BASE as ROOT_API_BASE } from "@/services/companyApi";
import { resolveAssetUrl } from "@/lib/api";
import AuthService, { type AuthUser } from "@/services/authService";

const API_BASE = `${ROOT_API_BASE}/api`;
const api = axios.create({ baseURL: API_BASE, withCredentials: true });

const RECENT_LOGIN_WINDOW_MS = 15 * 60 * 1000;

const buildInitials = (name?: string, email?: string) =>
  (name || email || "User")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

const hasRecentLogin = (lastLogin?: string | null) => {
  if (!lastLogin) return false;
  const timestamp = new Date(lastLogin).getTime();
  return !Number.isNaN(timestamp) && Date.now() - timestamp <= RECENT_LOGIN_WINDOW_MS;
};

const formatLastLogin = (lastLogin?: string | null, isCurrentUser?: boolean) => {
  if (isCurrentUser) {
    return "Logged in on this session";
  }

  if (!lastLogin) {
    return "No login recorded yet";
  }

  const parsed = new Date(lastLogin);
  return Number.isNaN(parsed.getTime())
    ? "Recent login recorded"
    : `Last login: ${parsed.toLocaleString()}`;
};

export default function UserManagement() {
  const { toast } = useToast();
  const [currentUser] = useState<AuthUser | null>(() => AuthService.getUser());
  
  // States for Database Data
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("users");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role_id: "",
    department_id: "",
    status: "Active",
    selectedPermissionIds: [] as number[]
  });

  // --- Data Sync ---
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [u, r, d, p] = await Promise.all([
        api.get("/users"),
        api.get("/roles"),
        api.get("/departments"),
        api.get("/permissions")
      ]);
      setUsers(u.data);
      setRoles(r.data);
      setDepartments(d.data);
      setPermissions(p.data);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "API Error",
        description: "Could not fetch admin data from the backend API."
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadData(); }, [loadData]);

  const usersByRole = useMemo(() => {
    const counts = new Map<number, number>();
    users.forEach((user) => {
      if (user.role_id) {
        counts.set(user.role_id, (counts.get(user.role_id) || 0) + 1);
      }
    });
    return counts;
  }, [users]);

  const usersByDepartment = useMemo(() => {
    const counts = new Map<number, number>();
    users.forEach((user) => {
      if (user.department_id) {
        counts.set(user.department_id, (counts.get(user.department_id) || 0) + 1);
      }
    });
    return counts;
  }, [users]);

  const usersByPermission = useMemo(() => {
    const counts = new Map<string, number>();
    users.forEach((user) => {
      const assignedPermissions = Array.isArray(user.permissions) ? user.permissions : [];
      assignedPermissions.forEach((permissionName: string) => {
        counts.set(permissionName, (counts.get(permissionName) || 0) + 1);
      });
    });
    return counts;
  }, [users]);

  const totalPermissionAssignments = useMemo(() => {
    let total = 0;
    usersByPermission.forEach((count) => {
      total += count;
    });
    return total;
  }, [usersByPermission]);

  const currentUserId = currentUser?.id ?? null;

  // --- Actions ---
  const handleOpenModal = (item?: any) => {
    if (item) {
      setEditingId(item.id);
      setFormData({
        name: item.name || "",
        email: item.email || "",
        password: "", // Security: don't pre-fill password
        role_id: item.role_id?.toString() || "",
        department_id: item.department_id?.toString() || "",
        status: item.status || "Active",
        selectedPermissionIds: item.permissions?.map((pName: string) => 
          permissions.find(p => p.name === pName)?.id
        ).filter(Boolean) || []
      });
    } else {
      setEditingId(null);
      setFormData({ name: "", email: "", password: "", role_id: "", department_id: "", status: "Active", selectedPermissionIds: [] });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const endpoint = `/${activeTab}`;
      let payload: any = { name: formData.name };

      if (activeTab === "users") {
        payload = {
          ...payload,
          email: formData.email,
          status: formData.status,
          role_id: formData.role_id ? parseInt(formData.role_id) : null,
          department_id: formData.department_id ? parseInt(formData.department_id) : null,
          permissions: formData.selectedPermissionIds // Array of IDs
        };
        if (formData.password) payload.password = formData.password;
      }

      if (editingId) {
        await api.put(`${endpoint}/${editingId}`, payload);
      } else {
        await api.post(endpoint, payload);
      }

      toast({ title: "Success", description: `${activeTab} updated.` });
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Save Failed", description: err.response?.data?.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure?")) return;
    try {
      await api.delete(`/${activeTab}/${id}`);
      toast({ title: "Deleted" });
      loadData();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.response?.data?.message });
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold">Admin Management</h1>
          <p className="text-muted-foreground">Configure users, departments, and access levels.</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="mr-2 h-4 w-4" /> Add {activeTab.slice(0, -1)}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <div className="text-2xl font-bold">{users.length}</div>
              <div className="text-sm text-muted-foreground">Total Users</div>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <div className="text-2xl font-bold">{roles.length}</div>
              <div className="text-sm text-muted-foreground">Roles</div>
              <div className="text-xs text-muted-foreground">
                {roles.reduce((sum, role) => sum + (usersByRole.get(role.id) || 0), 0)} assignments
              </div>
            </div>
            <ShieldCheck className="h-8 w-8 text-emerald-600" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <div className="text-2xl font-bold">{departments.length}</div>
              <div className="text-sm text-muted-foreground">Departments</div>
              <div className="text-xs text-muted-foreground">
                {departments.reduce((sum, department) => sum + (usersByDepartment.get(department.id) || 0), 0)} assignments
              </div>
            </div>
            <Building2 className="h-8 w-8 text-orange-600" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <div className="text-2xl font-bold">{permissions.length}</div>
              <div className="text-sm text-muted-foreground">Permissions</div>
              <div className="text-xs text-muted-foreground">{totalPermissionAssignments} assignments</div>
            </div>
            <Key className="h-8 w-8 text-violet-600" />
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>

        {["users", "roles", "departments", "permissions"].map((tab) => (
          <TabsContent key={tab} value={tab}>
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{tab === "users" ? "Name" : "Label"}</TableHead>
                    {tab === "users" && (
                      <>
                        <TableHead>Role</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Permissions</TableHead>
                        <TableHead>Status</TableHead>
                      </>
                    )}
                    {tab !== "users" && <TableHead>Assigned Users</TableHead>}
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(tab === "users" ? users : tab === "roles" ? roles : tab === "departments" ? departments : permissions).map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {tab === "users" ? (
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <Avatar className="h-10 w-10 border border-slate-200">
                                <AvatarImage
                                  src={resolveAssetUrl(item.profile_picture_url) || "/default-avatar.svg"}
                                  alt={item.name || "User"}
                                />
                                <AvatarFallback className="bg-slate-900 text-xs font-semibold text-white">
                                  {buildInitials(item.name, item.email)}
                                </AvatarFallback>
                              </Avatar>
                              {(item.id === currentUserId || hasRecentLogin(item.last_login)) && (
                                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 font-medium">
                                <span className="truncate">{item.name}</span>
                                {item.id === currentUserId && (
                                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                                    Logged in
                                  </Badge>
                                )}
                              </div>
                              {item.email && <div className="text-xs text-muted-foreground">{item.email}</div>}
                              <div className="text-xs text-muted-foreground">
                                {formatLastLogin(item.last_login, item.id === currentUserId)}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="font-medium">{item.name}</div>
                            {item.email && <div className="text-xs text-muted-foreground">{item.email}</div>}
                          </>
                        )}
                      </TableCell>
                      {tab === "users" && (
                        <>
                          <TableCell>{item.role || "N/A"}</TableCell>
                          <TableCell>{item.department || "N/A"}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{Array.isArray(item.permissions) ? item.permissions.length : 0} assigned</Badge>
                          </TableCell>
                          <TableCell><Badge>{item.status}</Badge></TableCell>
                        </>
                      )}
                      {tab === "roles" && (
                        <TableCell>
                          <Badge variant="secondary">{usersByRole.get(item.id) || 0} users</Badge>
                        </TableCell>
                      )}
                      {tab === "departments" && (
                        <TableCell>
                          <Badge variant="secondary">{usersByDepartment.get(item.id) || 0} users</Badge>
                        </TableCell>
                      )}
                      {tab === "permissions" && (
                        <TableCell>
                          <Badge variant="secondary">{usersByPermission.get(item.name) || 0} users</Badge>
                        </TableCell>
                      )}
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenModal(item)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit" : "New"} {activeTab}</DialogTitle>
            <DialogDescription>Modify organizational data here.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            </div>

            {activeTab === "users" && (
              <>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Password {editingId && "(Leave blank to keep current)"}</Label>
                  <Input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required={!editingId} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={formData.role_id} onValueChange={v => setFormData({...formData, role_id: v})}>
                      <SelectTrigger><SelectValue placeholder="Select Role" /></SelectTrigger>
                      <SelectContent>
                        {roles.map(r => <SelectItem key={r.id} value={r.id.toString()}>{r.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Select value={formData.department_id} onValueChange={v => setFormData({...formData, department_id: v})}>
                      <SelectTrigger><SelectValue placeholder="Select Dept" /></SelectTrigger>
                      <SelectContent>
                        {departments.map(d => <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Assign Permissions</Label>
                  <div className="grid grid-cols-2 gap-2 border p-3 rounded-md max-h-32 overflow-y-auto">
                    {permissions.map(p => (
                      <div key={p.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`p-${p.id}`} 
                          checked={formData.selectedPermissionIds.includes(p.id)}
                          onCheckedChange={(checked) => {
                            const ids = checked 
                              ? [...formData.selectedPermissionIds, p.id] 
                              : formData.selectedPermissionIds.filter(id => id !== p.id);
                            setFormData({...formData, selectedPermissionIds: ids});
                          }}
                        />
                        <Label htmlFor={`p-${p.id}`} className="text-xs">{p.name}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
