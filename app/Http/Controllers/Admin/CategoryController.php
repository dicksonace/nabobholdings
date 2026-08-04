<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function index(): Response
    {
        $categories = Category::with(['parent:id,name'])
            ->withCount('products')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn (Category $category) => [
                'id' => $category->id,
                'name' => $category->name,
                'slug' => $category->slug,
                'icon' => $category->icon,
                'parent_id' => $category->parent_id,
                'parent_name' => $category->parent?->name,
                'is_active' => $category->is_active,
                'sort_order' => $category->sort_order,
                'products_count' => $category->products_count,
            ]);

        $parents = Category::query()
            ->whereNull('parent_id')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('admin/categories/index', [
            'categories' => $categories,
            'parents' => $parents,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'icon' => ['nullable', 'string', 'max:10'],
            'parent_id' => ['nullable', 'integer', 'exists:categories,id'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:999'],
        ]);

        $slug = $this->uniqueSlug(Str::slug($validated['name']));
        $config = config("category_specs.{$slug}");

        Category::create([
            'name' => $validated['name'],
            'slug' => $slug,
            'icon' => $validated['icon'] ?? ($config['icon'] ?? null),
            'parent_id' => $validated['parent_id'] ?? null,
            'spec_schema' => $config ? ['fields' => $config['fields']] : null,
            'is_active' => true,
            'sort_order' => $validated['sort_order'] ?? 0,
        ]);

        return back()->with('success', 'Category created.');
    }

    public function update(Request $request, Category $category): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'icon' => ['nullable', 'string', 'max:10'],
            'parent_id' => ['nullable', 'integer', 'exists:categories,id'],
            'is_active' => ['boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:999'],
        ]);

        $parentId = $validated['parent_id'] ?? null;
        if ($parentId === $category->id) {
            return back()->withErrors(['parent_id' => 'A category cannot be its own parent.']);
        }

        $category->update([
            'name' => $validated['name'],
            'icon' => $validated['icon'] ?? null,
            'parent_id' => $parentId,
            'is_active' => $validated['is_active'] ?? $category->is_active,
            'sort_order' => $validated['sort_order'] ?? $category->sort_order,
        ]);

        return back()->with('success', 'Category updated.');
    }

    public function destroy(Category $category): RedirectResponse
    {
        if ($category->products()->exists()) {
            $category->update(['is_active' => false]);

            return back()->with('success', 'Category has products — it was hidden instead of deleted.');
        }

        $category->delete();

        return back()->with('success', 'Category deleted.');
    }

    private function uniqueSlug(string $slug): string
    {
        $original = $slug ?: 'category';
        $candidate = $original;
        $count = 1;

        while (Category::where('slug', $candidate)->exists()) {
            $candidate = "{$original}-{$count}";
            $count++;
        }

        return $candidate;
    }
}
