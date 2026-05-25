import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { Building2, Loader2, LockKeyhole, Mail, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import AuthService from "@/services/authService";
import { API_BASE } from "@/services/companyApi";

interface OptionRecord {
  id: number;
  name: string;
}

export default function SignUp() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [roles, setRoles] = useState<OptionRecord[]>([]);
  const [departments, setDepartments] = useState<OptionRecord[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [rolesResponse, departmentsResponse] = await Promise.all([
          axios.get<OptionRecord[]>(`${API_BASE}/api/roles`),
          axios.get<OptionRecord[]>(`${API_BASE}/api/departments`),
        ]);

        setRoles(rolesResponse.data || []);
        setDepartments(departmentsResponse.data || []);
      } catch (error) {
        console.error("Failed to load signup options:", error);
      }
    };

    void loadOptions();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await AuthService.signUp({
        name,
        email,
        password,
        role_id: roleId ? Number(roleId) : null,
        department_id: departmentId ? Number(departmentId) : null,
        profile_picture: profilePicture,
      });
      navigate("/login ", { replace: true });
    } catch (error: any) {
      console.error("Signup failed:", error);
      toast({
        title: "Signup Failed",
        description: error?.response?.data?.error || "Could not create the account.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <Card className="w-full max-w-lg border-slate-200 shadow-lg">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription>Set up a user profile for the operations system.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password">Password</Label>
              <div className="relative">
                <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="signup-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={roleId} onValueChange={setRoleId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Optional role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={String(role.id)}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={departmentId} onValueChange={setDepartmentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Optional department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((department) => (
                      <SelectItem key={department.id} value={String(department.id)}>
                        {department.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-profile-picture">Profile Picture</Label>
              <Input
                id="signup-profile-picture"
                type="file"
                accept="image/*"
                onChange={(event) => setProfilePicture(event.target.files?.[0] || null)}
              />
            </div>
            <div className="rounded-lg border bg-slate-50 p-3 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                The first signup can bootstrap an administrator account automatically.
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"}
            </Button>
          </form>
          <p className="mt-4 text-sm text-slate-600">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
