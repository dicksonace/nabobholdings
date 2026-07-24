@props(['url'])
@php
    $brandName = \App\Services\PlatformSettings::brandName();
    $logoUrl = \App\Services\PlatformSettings::brandLogoUrl();
    $parts = preg_split('/\s+/', trim($brandName), 2);
    $brandFirst = $parts[0] ?? $brandName;
    $brandRest = $parts[1] ?? '';
@endphp
<tr>
<td class="header">
<a href="{{ $url }}" style="display: inline-block;">
@if ($logoUrl)
<img src="{{ $logoUrl }}" class="logo" alt="{{ $brandName }}">
@else
{{ $brandFirst }}@if ($brandRest)<span class="brand-accent">&nbsp;{{ $brandRest }}</span>@endif
@endif
</a>
</td>
</tr>
