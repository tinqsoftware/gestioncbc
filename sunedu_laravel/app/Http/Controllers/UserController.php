<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * GET /api/users
     */
    public function index()
    {
        $users = User::select('id', 'name', 'email', 'role', 'must_change_password')->get();
        return response()->json($users);
    }

    /**
     * POST /api/users
     */
    public function store(Request $request)
    {
        $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|string',
            'role'     => 'required|string',
        ]);

        $user = User::create([
            'name'                 => $request->name,
            'email'                => $request->email,
            'password'             => $request->password,  // plain text, igual que el original
            'role'                 => $request->role,
            'must_change_password' => 1,
        ]);

        return response()->json(['id' => $user->id, 'message' => 'Usuario creado exitosamente'], 201);
    }

    /**
     * PUT /api/users/{id}
     */
    public function update(Request $request, int $id)
    {
        $user = User::findOrFail($id);

        $request->validate([
            'name'  => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $id,
            'role'  => 'required|string',
        ]);

        $user->update([
            'name'  => $request->name,
            'email' => $request->email,
            'role'  => $request->role,
        ]);

        return response()->json(['message' => 'Usuario actualizado exitosamente']);
    }

    /**
     * DELETE /api/users/{id}
     */
    public function destroy(int $id)
    {
        User::findOrFail($id)->delete();
        return response()->json(['message' => 'Usuario eliminado exitosamente']);
    }

    /**
     * POST /api/users/{id}/reset-password
     * Resetea la contraseña a '12345678' y fuerza cambio en próximo login.
     */
    public function resetPassword(int $id)
    {
        $user = User::findOrFail($id);
        $user->update([
            'password'             => '12345678',
            'must_change_password' => 1,
        ]);
        return response()->json(['message' => 'Contraseña reseteada exitosamente']);
    }

    /**
     * POST /api/users/change-password
     * Permite al usuario cambiar su propia contraseña.
     */
    public function changePassword(Request $request)
    {
        $request->validate([
            'userId'      => 'required|integer',
            'oldPassword' => 'required|string',
            'newPassword' => 'required|string|min:6',
        ]);

        $user = User::where('id', $request->userId)
                    ->where('password', $request->oldPassword)
                    ->first();

        if (! $user) {
            return response()->json(['error' => 'La contraseña actual es incorrecta'], 401);
        }

        $user->update([
            'password'             => $request->newPassword,
            'must_change_password' => 0,
        ]);

        return response()->json(['message' => 'Contraseña actualizada exitosamente']);
    }
}
