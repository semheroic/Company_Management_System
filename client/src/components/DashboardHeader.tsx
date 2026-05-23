import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import AuthService, { type AuthUser } from "@/services/authService";
import { resolveAssetUrl } from "@/lib/api";
import { Loader2, LogOut, UserCog } from "lucide-react";

export function DashboardHeader() {
  return (
    <div className="flex-1">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening with your business.</p>
      </div>
    </div>
  );
}

const emptyProfileForm = {
  name: "",
  email: "",
  password: "",
  profile_picture_url: "",
};

export function DashboardUserMenu() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(() => AuthService.getUser());
  const [formData, setFormData] = useState(emptyProfileForm);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);

  useEffect(() => {
    const syncProfile = async () => {
      try {
        const currentUser = await AuthService.getProfile();
        setUser(currentUser);
      } catch {
        setUser(AuthService.getUser());
      }
    };

    void syncProfile();
  }, []);

  useEffect(() => {
    if (!isProfileOpen || !user) {
      return;
    }

    setFormData({
      name: user.name || "",
      email: user.email || "",
      password: "",
      profile_picture_url: user.profile_picture_url || "",
    });
    setProfilePictureFile(null);
  }, [isProfileOpen, user]);

  const initials = useMemo(() => {
    const source = user?.name?.trim() || user?.email || "User";
    return source
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("");
  }, [user]);

  const handleSaveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      const updatedUser = await AuthService.updateProfile({
        name: formData.name,
        email: formData.email,
        password: formData.password || undefined,
        profile_picture_url: formData.profile_picture_url || null,
        profile_picture: profilePictureFile,
      });

      setUser(updatedUser);
      setIsProfileOpen(false);
      toast({
        title: "Profile Updated",
        description: "Your account details have been saved.",
      });
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error?.response?.data?.error || "Could not update your profile.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      await AuthService.logout();
      navigate("/login", { replace: true });
    } catch {
      navigate("/login", { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={isLoggingOut}>
          <Button variant="outline" className="h-11 gap-3 rounded-xl border-slate-200 px-3 shadow-sm">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={resolveAssetUrl(user?.profile_picture_url) || "/default-avatar.svg"}
                alt={user?.name || "User"}
              />
              <AvatarFallback className="bg-slate-900 text-xs font-semibold text-white">
                {initials || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="hidden min-w-0 text-left sm:block">
              <div className="truncate text-sm font-semibold text-slate-900">
                {user?.name || "Current User"}
              </div>
              <div className="truncate text-xs text-slate-500">
                {user?.role || user?.email || "Signed in"}
              </div>
            </div>
            {isLoggingOut && <Loader2 className="h-4 w-4 animate-spin text-slate-500" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuLabel className="space-y-1">
            <div className="text-sm font-semibold text-slate-900">{user?.name || "Current User"}</div>
            <div className="text-xs font-normal text-slate-500">{user?.email || "No email available"}</div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={(event) => {
            event.preventDefault();
            setIsProfileOpen(true);
          }}>
            <UserCog className="mr-2 h-4 w-4" />
            Edit Profile
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-red-600 focus:text-red-700"
            onSelect={(event) => {
              event.preventDefault();
              void handleLogout();
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>Update your name, email, or password for the active session.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profile-name">Full Name</Label>
              <Input
                id="profile-name"
                value={formData.name}
                onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-email">Email</Label>
              <Input
                id="profile-email"
                type="email"
                value={formData.email}
                onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-password">New Password</Label>
              <Input
                id="profile-password"
                type="password"
                value={formData.password}
                onChange={(event) => setFormData((current) => ({ ...current, password: event.target.value }))}
                placeholder="Leave blank to keep the current password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-picture">Profile Picture</Label>
              <Input
                id="profile-picture"
                type="file"
                accept="image/*"
                onChange={(event) => setProfilePictureFile(event.target.files?.[0] || null)}
              />
              <p className="text-xs text-slate-500">
                Leave this empty to keep the current profile picture.
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsProfileOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
