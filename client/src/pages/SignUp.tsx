import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { Building2, Loader2, LockKeyhole, Mail, Upload, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import AuthService from "@/services/authService";
import { API_BASE } from "@/services/companyApi";
import { AuthShell } from "@/components/auth/AuthShell";

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

      navigate("/", { replace: true });
    } catch (error: unknown) {
      console.error("Signup failed:", error);
      toast({
        title: "Signup Failed",
        description:
          typeof error === "object" &&
          error !== null &&
          "response" in error &&
          typeof (error as { response?: { data?: { error?: string } } }).response?.data?.error === "string"
            ? (error as { response?: { data?: { error?: string } } }).response?.data?.error || "Could not create the account."
            : "Could not create the account.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Account Setup"
      title="Create your operator account"
      description="Register a user profile for the company management system and start working inside the protected operations workspace immediately."
      asideTitle="Structured onboarding"
      asideDescription="New accounts are provisioned against the same user, role, and department model used throughout the operational dashboard."
      highlights={[
        "The first account can bootstrap administrative access for the environment.",
        "User role and department metadata flow into profile management, permissions, and team oversight pages.",
        "Profile images, session persistence, and responsive auth screens are handled in the same frontend stack as the core app.",
      ]}
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-sky-700 transition-colors hover:text-sky-600">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="name" className="text-slate-700">
              Full Name
            </Label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="h-12 rounded-xl border-slate-200 pl-11"
                placeholder="Enter full name"
                required
              />
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="signup-email" className="text-slate-700">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="signup-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-12 rounded-xl border-slate-200 pl-11"
                placeholder="name@company.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="signup-password" className="text-slate-700">
              Password
            </Label>
            <div className="relative">
              <LockKeyhole className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="signup-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-12 rounded-xl border-slate-200 pl-11"
                placeholder="Create a password"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700">Role</Label>
            <Select value={roleId} onValueChange={setRoleId}>
              <SelectTrigger className="h-12 rounded-xl border-slate-200">
                <SelectValue placeholder="Select a role" />
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
            <Label className="text-slate-700">Department</Label>
            <Select value={departmentId} onValueChange={setDepartmentId}>
              <SelectTrigger className="h-12 rounded-xl border-slate-200">
                <SelectValue placeholder="Select a department" />
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

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
            <Upload className="h-4 w-4 text-sky-700" />
            Profile Picture
          </div>
          <p className="mt-1 text-sm text-slate-600">Optional. Upload an image now or update the profile later from the dashboard menu.</p>
          <Input
            id="signup-profile-picture"
            type="file"
            accept="image/*"
            onChange={(event) => setProfilePicture(event.target.files?.[0] || null)}
            className="mt-4 cursor-pointer rounded-xl border-slate-200 bg-white"
          />
        </div>

        <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4 text-sm text-slate-700">
          <div className="flex items-center gap-2 font-medium text-slate-900">
            <Building2 className="h-4 w-4 text-sky-700" />
            Initial environment note
          </div>
          <p className="mt-1">
            If this is the first user in the environment, the account can initialize administrative access for the workspace automatically.
          </p>
        </div>

        <Button type="submit" className="h-12 w-full rounded-xl bg-slate-950 text-white hover:bg-slate-800" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account
            </>
          ) : (
            "Create Account"
          )}
        </Button>
      </form>
    </AuthShell>
  );
}
