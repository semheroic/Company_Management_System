import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { 
  ArrowLeft, Plus, Users, Shield, Edit, Trash2, 
  Building2, Key, Loader2, Save, Info, CheckCircle2 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

const API_BASE = "http://localhost:5000/api";
const api = axios.create({ baseURL: API_BASE });

export default function UserManagement() {
  const { toast } = useToast();
  
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
        description: "Could not fetch data from localhost:5000. Is the server running?"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadData(); }, [loadData]);

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

      <Tabs defaultValue="users" onValueChange={setActiveTab}>
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
                        <TableHead>Status</TableHead>
                      </>
                    )}
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(tab === "users" ? users : tab === "roles" ? roles : tab === "departments" ? departments : permissions).map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium">{item.name}</div>
                        {item.email && <div className="text-xs text-muted-foreground">{item.email}</div>}
                      </TableCell>
                      {tab === "users" && (
                        <>
                          <TableCell>{item.role || "N/A"}</TableCell>
                          <TableCell><Badge>{item.status}</Badge></TableCell>
                        </>
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